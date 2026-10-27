import React, { useEffect, useRef, useState, useImperativeHandle, forwardRef } from 'react';
import { 
  createChart, 
  ColorType, 
  CrosshairMode, 
  CandlestickSeries, 
  LineSeries, 
  HistogramSeries, 
  UTCTimestamp,
  IChartApi,
  ISeriesApi
} from 'lightweight-charts';
import { sounds } from '../services/soundEffects';
import { 
  TrendingUp, Slash, Minus, Square, Type, 
  Trash2, Ruler, Maximize2, Minimize2, Crosshair,
  Pencil, Sparkles
} from 'lucide-react';

export type ChartTimeframe = '1m' | '5m' | '15m' | '1H' | '1D' | '1W';
export type ChartType = 'candle' | 'line';
export type DrawingToolType = 'cursor' | 'trendline' | 'horizontal' | 'fib' | 'rectangle' | 'ruler' | 'text' | 'brush' | 'eraser';

export interface CandleData {
  time: UTCTimestamp;
  open: number;
  high: number;
  low: number;
  close: number;
  volume?: number;
}

export interface DrawingItem {
  id: string;
  type: DrawingToolType;
  color: string;
  points: { x: number; y: number; price?: number; time?: number }[];
  text?: string;
  priceLevel?: number;
}

export interface DrawingMetadata {
  totalCount: number;
  trendlines: number;
  horizontalLevels: number;
  fibonacci: number;
  zones: number;
  rulers: number;
  textAnnotations: number;
  brushStrokes: number;
  chartPriceLines: number;
  lastUpdated: number;
  items: DrawingItem[];
}

interface TradingViewChartProps {
  symbol: string;
  name: string;
  currentPrice: number;
  timeframe: ChartTimeframe;
  onTimeframeChange: (tf: ChartTimeframe) => void;
  chartType: ChartType;
  onChartTypeChange: (ct: ChartType) => void;
  currencySymbol: string;
  displayDecimals?: number;
  isMarketOpen?: boolean;
  onDrawingMetadataChange?: (metadata: DrawingMetadata) => void;
}

export interface TradingViewChartRef {
  updateTick: (price: number) => void;
  getDrawingMetadata: () => DrawingMetadata;
  clearAllDrawings: () => { clearedCount: number; clearedTypes: string[] };
  setDrawingTool: (tool: DrawingToolType) => void;
  addQuickHorizontalLevel: (price?: number) => void;
  getChartApi: () => IChartApi | null;
  getSeriesApi: () => ISeriesApi<'Candlestick'> | null;
}

export const TradingViewChart = forwardRef<TradingViewChartRef, TradingViewChartProps>(({
  symbol,
  name,
  currentPrice,
  timeframe,
  onTimeframeChange,
  chartType,
  onChartTypeChange,
  currencySymbol,
  displayDecimals = 2,
  isMarketOpen = true,
  onDrawingMetadataChange,
}, ref) => {
  const chartContainerRef = useRef<HTMLDivElement | null>(null);
  const chartInstanceRef = useRef<IChartApi | null>(null);
  const candleSeriesRef = useRef<ISeriesApi<'Candlestick'> | null>(null);
  const lineSeriesRef = useRef<ISeriesApi<'Line'> | null>(null);
  const volumeSeriesRef = useRef<ISeriesApi<'Histogram'> | null>(null);
  const ema20SeriesRef = useRef<ISeriesApi<'Line'> | null>(null);
  const ema50SeriesRef = useRef<ISeriesApi<'Line'> | null>(null);

  // Native Lightweight Charts price line references for support/resistance lines
  const nativePriceLinesRef = useRef<any[]>([]);

  // Candles data state
  const candlesRef = useRef<CandleData[]>([]);

  // Indicators toggle
  const [showEMA20, setShowEMA20] = useState(true);
  const [showEMA50, setShowEMA50] = useState(false);
  const [showVolume, setShowVolume] = useState(true);

  // Hover OHLC bar
  const [hoverOHLC, setHoverOHLC] = useState<{ open: number; high: number; low: number; close: number; change: number } | null>(null);

  // Drawing Tools State
  const [activeTool, setActiveTool] = useState<DrawingToolType>('cursor');
  const [drawingColor, setDrawingColor] = useState('#00FF87');
  const [drawings, setDrawings] = useState<DrawingItem[]>(() => {
    try {
      const saved = localStorage.getItem(`samzen_drawings_${symbol}`);
      return saved ? JSON.parse(saved) : [];
    } catch {
      return [];
    }
  });

  const [isDrawing, setIsDrawing] = useState(false);
  const [activeDrawing, setActiveDrawing] = useState<DrawingItem | null>(null);
  const [textPrompt, setTextPrompt] = useState<{ x: number; y: number } | null>(null);
  const [textInput, setTextInput] = useState('');
  const [isFullscreen, setIsFullscreen] = useState(false);

  // Compute Drawing Metadata
  const calculateDrawingMetadata = (items: DrawingItem[]): DrawingMetadata => {
    return {
      totalCount: items.length,
      trendlines: items.filter((d) => d.type === 'trendline').length,
      horizontalLevels: items.filter((d) => d.type === 'horizontal').length,
      fibonacci: items.filter((d) => d.type === 'fib').length,
      zones: items.filter((d) => d.type === 'rectangle').length,
      rulers: items.filter((d) => d.type === 'ruler').length,
      textAnnotations: items.filter((d) => d.type === 'text').length,
      brushStrokes: items.filter((d) => d.type === 'brush').length,
      chartPriceLines: nativePriceLinesRef.current.length,
      lastUpdated: Date.now(),
      items: [...items],
    };
  };

  // Notify parent component whenever drawings change
  useEffect(() => {
    const meta = calculateDrawingMetadata(drawings);
    onDrawingMetadataChange?.(meta);
  }, [drawings]);

  // Save drawings to localStorage per symbol
  useEffect(() => {
    try {
      localStorage.setItem(`samzen_drawings_${symbol}`, JSON.stringify(drawings));
    } catch {
      // ignore
    }
  }, [drawings, symbol]);

  // Load drawings when symbol changes
  useEffect(() => {
    try {
      // Remove any existing native price lines from the previous symbol
      if (candleSeriesRef.current && nativePriceLinesRef.current.length > 0) {
        nativePriceLinesRef.current.forEach((line) => {
          try {
            candleSeriesRef.current?.removePriceLine(line);
          } catch {
            // ignore
          }
        });
        nativePriceLinesRef.current = [];
      }

      const saved = localStorage.getItem(`samzen_drawings_${symbol}`);
      const loaded: DrawingItem[] = saved ? JSON.parse(saved) : [];
      setDrawings(loaded);

      // Re-create native price lines if any horizontal levels were saved
      if (candleSeriesRef.current) {
        loaded.forEach((item) => {
          if (item.type === 'horizontal' && item.priceLevel) {
            try {
              const line = candleSeriesRef.current?.createPriceLine({
                price: item.priceLevel,
                color: item.color || '#00FF87',
                lineWidth: 1,
                lineStyle: 2,
                axisLabelVisible: true,
                title: 'S/R LEVEL',
              });
              if (line) nativePriceLinesRef.current.push(line);
            } catch {
              // ignore
            }
          }
        });
      }
    } catch {
      setDrawings([]);
    }
  }, [symbol]);

  // Helper to calculate EMA
  const calculateEMA = (data: CandleData[], period: number) => {
    if (data.length < period) return [];
    const k = 2 / (period + 1);
    let ema = data.slice(0, period).reduce((sum, d) => sum + d.close, 0) / period;
    const result: { time: UTCTimestamp; value: number }[] = [];

    data.slice(period).forEach((d) => {
      ema = d.close * k + ema * (1 - k);
      result.push({ time: d.time, value: Number(ema.toFixed(displayDecimals)) });
    });
    return result;
  };

  // Generate realistic historical candle data
  const generateHistory = (basePrice: number, tf: ChartTimeframe): CandleData[] => {
    const count = 120;
    const result: CandleData[] = [];
    const nowSec = Math.floor(Date.now() / 1000);

    let tfSec = 60;
    if (tf === '5m') tfSec = 300;
    else if (tf === '15m') tfSec = 900;
    else if (tf === '1H') tfSec = 3600;
    else if (tf === '1D') tfSec = 86400;
    else if (tf === '1W') tfSec = 604800;

    let volatility = 0.002;
    if (tf === '1m') volatility = 0.0006;
    if (tf === '5m') volatility = 0.0012;
    if (tf === '15m') volatility = 0.002;
    if (tf === '1H') volatility = 0.004;
    if (tf === '1D') volatility = 0.012;
    if (tf === '1W') volatility = 0.025;

    let price = basePrice * (1 - count * volatility * 0.25);
    for (let i = 0; i < count; i++) {
      const time = (nowSec - (count - i) * tfSec) as UTCTimestamp;
      const change = (Math.sin(i * 0.4) * 0.6 + (Math.random() - 0.48)) * volatility * price;
      const open = price;
      const close = Number((open + change).toFixed(displayDecimals));
      const high = Number((Math.max(open, close) + Math.random() * volatility * price * 0.8).toFixed(displayDecimals));
      const low = Number((Math.min(open, close) - Math.random() * volatility * price * 0.8).toFixed(displayDecimals));
      const volume = Math.floor(Math.random() * 5000 + 500);

      result.push({ time, open, high, low, close, volume });
      price = close;
    }

    // Anchor last candle close to current price
    if (result.length > 0) {
      const last = result[result.length - 1];
      last.close = currentPrice;
      last.high = Math.max(last.high, currentPrice);
      last.low = Math.min(last.low, currentPrice);
    }

    return result;
  };

  // Initialize and mount Lightweight Chart
  useEffect(() => {
    if (!chartContainerRef.current) return;

    // Clear previous instance
    if (chartInstanceRef.current) {
      chartInstanceRef.current.remove();
      chartInstanceRef.current = null;
    }

    const container = chartContainerRef.current;
    const chart = createChart(container, {
      layout: {
        background: { type: ColorType.Solid, color: '#0A0E17' },
        textColor: '#94A3B8',
        fontFamily: "'JetBrains Mono', monospace",
        fontSize: 11,
      },
      grid: {
        vertLines: { color: 'rgba(255, 255, 255, 0.04)' },
        horzLines: { color: 'rgba(255, 255, 255, 0.04)' },
      },
      crosshair: {
        mode: CrosshairMode.Normal,
        vertLine: {
          color: 'rgba(0, 255, 135, 0.4)',
          width: 1,
          style: 2,
        },
        horzLine: {
          color: 'rgba(0, 255, 135, 0.4)',
          width: 1,
          style: 2,
        },
      },
      rightPriceScale: {
        borderColor: 'rgba(255, 255, 255, 0.1)',
        scaleMargins: {
          top: 0.1,
          bottom: 0.2,
        },
      },
      timeScale: {
        borderColor: 'rgba(255, 255, 255, 0.1)',
        timeVisible: true,
        secondsVisible: false,
      },
      handleScroll: true,
      handleScale: true,
    });

    chartInstanceRef.current = chart;

    // Add Volume Series at bottom
    const volumeSeries = chart.addSeries(HistogramSeries, {
      color: 'rgba(0, 255, 135, 0.25)',
      priceFormat: { type: 'volume' },
      priceScaleId: '', // overlay
    });
    volumeSeries.priceScale().applyOptions({
      scaleMargins: { top: 0.8, bottom: 0 },
    });
    volumeSeriesRef.current = volumeSeries;

    // Add Candlestick Series with Signature Emerald & Crimson
    const candleSeries = chart.addSeries(CandlestickSeries, {
      upColor: '#00FF87',
      downColor: '#FF3366',
      borderVisible: false,
      wickUpColor: '#00FF87',
      wickDownColor: '#FF3366',
    });
    candleSeriesRef.current = candleSeries;

    // Add Line Series (alternative to candle)
    const lineSeries = chart.addSeries(LineSeries, {
      color: '#00FF87',
      lineWidth: 2,
      visible: chartType === 'line',
    });
    lineSeriesRef.current = lineSeries;

    // Add EMA 20 & EMA 50
    const ema20 = chart.addSeries(LineSeries, {
      color: '#00F0FF',
      lineWidth: 1,
      visible: showEMA20,
    });
    ema20SeriesRef.current = ema20;

    const ema50 = chart.addSeries(LineSeries, {
      color: '#FFD700',
      lineWidth: 1,
      visible: showEMA50,
    });
    ema50SeriesRef.current = ema50;

    // Populate data
    const initialCandles = generateHistory(currentPrice, timeframe);
    candlesRef.current = initialCandles;

    candleSeries.setData(initialCandles);
    lineSeries.setData(initialCandles.map((c) => ({ time: c.time, value: c.close })));

    volumeSeries.setData(
      initialCandles.map((c) => ({
        time: c.time,
        value: c.volume || 1000,
        color: c.close >= c.open ? 'rgba(0, 255, 135, 0.3)' : 'rgba(255, 51, 102, 0.3)',
      }))
    );

    if (showEMA20) {
      ema20.setData(calculateEMA(initialCandles, 20));
    }
    if (showEMA50) {
      ema50.setData(calculateEMA(initialCandles, 50));
    }

    // Crosshair move listener for header OHLC
    chart.subscribeCrosshairMove((param) => {
      if (!param.time || !param.seriesData) {
        setHoverOHLC(null);
        return;
      }
      const data = param.seriesData.get(candleSeries) as CandleData | undefined;
      if (data) {
        const change = Number((((data.close - data.open) / data.open) * 100).toFixed(2));
        setHoverOHLC({
          open: data.open,
          high: data.high,
          low: data.low,
          close: data.close,
          change,
        });
      }
    });

    // Auto resize
    const handleResize = () => {
      if (container && chart) {
        chart.applyOptions({
          width: container.clientWidth,
          height: container.clientHeight,
        });
      }
    };

    window.addEventListener('resize', handleResize);
    handleResize();

    return () => {
      window.removeEventListener('resize', handleResize);
      chart.remove();
      chartInstanceRef.current = null;
    };
  }, [symbol, timeframe]);

  // Sync chartType
  useEffect(() => {
    if (candleSeriesRef.current && lineSeriesRef.current) {
      candleSeriesRef.current.applyOptions({ visible: chartType === 'candle' });
      lineSeriesRef.current.applyOptions({ visible: chartType === 'line' });
    }
  }, [chartType]);

  // Sync EMA visibility
  useEffect(() => {
    if (ema20SeriesRef.current) {
      ema20SeriesRef.current.applyOptions({ visible: showEMA20 });
      if (showEMA20 && candlesRef.current.length > 0) {
        ema20SeriesRef.current.setData(calculateEMA(candlesRef.current, 20));
      }
    }
    if (ema50SeriesRef.current) {
      ema50SeriesRef.current.applyOptions({ visible: showEMA50 });
      if (showEMA50 && candlesRef.current.length > 0) {
        ema50SeriesRef.current.setData(calculateEMA(candlesRef.current, 50));
      }
    }
  }, [showEMA20, showEMA50]);

  // Sync Volume visibility
  useEffect(() => {
    if (volumeSeriesRef.current) {
      volumeSeriesRef.current.applyOptions({ visible: showVolume });
    }
  }, [showVolume]);

  // Clear all drawings implementation accessing chart API & drawing metadata
  const executeClearAllDrawings = () => {
    const typesSet = new Set(drawings.map((d) => d.type));
    const clearedTypes = Array.from(typesSet);
    const clearedCount = drawings.length;

    // 1. Remove native series price lines created in Lightweight Charts
    if (candleSeriesRef.current && nativePriceLinesRef.current.length > 0) {
      nativePriceLinesRef.current.forEach((line) => {
        try {
          candleSeriesRef.current?.removePriceLine(line);
        } catch {
          // ignore
        }
      });
      nativePriceLinesRef.current = [];
    }

    // 2. Clear state and localStorage drawing metadata
    setDrawings([]);
    setActiveDrawing(null);
    setTextPrompt(null);
    try {
      localStorage.removeItem(`samzen_drawings_${symbol}`);
    } catch {
      // ignore
    }

    // 3. Audio feedback
    sounds.playWhoosh();

    // 4. Notify parent callback
    onDrawingMetadataChange?.(calculateDrawingMetadata([]));

    return { clearedCount, clearedTypes };
  };

  // Imperative handle exposing drawing metadata & chart APIs to PaperTrading
  useImperativeHandle(ref, () => ({
    updateTick: (newPrice: number) => {
      if (!candleSeriesRef.current || candlesRef.current.length === 0) return;

      const candles = candlesRef.current;
      const lastCandle = candles[candles.length - 1];

      const updatedLast: CandleData = {
        ...lastCandle,
        close: newPrice,
        high: Math.max(lastCandle.high, newPrice),
        low: Math.min(lastCandle.low, newPrice),
      };

      candles[candles.length - 1] = updatedLast;
      candleSeriesRef.current.update(updatedLast);

      if (lineSeriesRef.current) {
        lineSeriesRef.current.update({ time: updatedLast.time, value: newPrice });
      }

      if (volumeSeriesRef.current) {
        volumeSeriesRef.current.update({
          time: updatedLast.time,
          value: (lastCandle.volume || 1000) + 10,
          color: newPrice >= lastCandle.open ? 'rgba(0, 255, 135, 0.4)' : 'rgba(255, 51, 102, 0.4)',
        });
      }
    },
    getDrawingMetadata: () => {
      return calculateDrawingMetadata(drawings);
    },
    clearAllDrawings: () => {
      return executeClearAllDrawings();
    },
    setDrawingTool: (tool: DrawingToolType) => {
      setActiveTool(tool);
      sounds.playClick();
    },
    addQuickHorizontalLevel: (targetPrice?: number) => {
      const p = targetPrice || currentPrice;
      if (candleSeriesRef.current) {
        try {
          const line = candleSeriesRef.current.createPriceLine({
            price: p,
            color: '#00FF87',
            lineWidth: 1,
            lineStyle: 2,
            axisLabelVisible: true,
            title: `S/R @ ${p}`,
          });
          if (line) nativePriceLinesRef.current.push(line);
        } catch {
          // ignore
        }
      }

      const newDrawing: DrawingItem = {
        id: `h-${Date.now()}`,
        type: 'horizontal',
        color: '#00FF87',
        points: [{ x: 0, y: 100 }, { x: 500, y: 100 }],
        priceLevel: p,
      };

      setDrawings((prev) => [...prev, newDrawing]);
      sounds.playClick();
    },
    getChartApi: () => chartInstanceRef.current,
    getSeriesApi: () => candleSeriesRef.current,
  }));

  // Handle SVG Drawings
  const svgRef = useRef<SVGSVGElement | null>(null);

  const getSvgCoordinates = (e: React.MouseEvent<SVGSVGElement>) => {
    if (!svgRef.current) return null;
    const rect = svgRef.current.getBoundingClientRect();
    return {
      x: e.clientX - rect.left,
      y: e.clientY - rect.top,
      width: rect.width,
      height: rect.height,
    };
  };

  const handleMouseDown = (e: React.MouseEvent<SVGSVGElement>) => {
    if (activeTool === 'cursor' || activeTool === 'eraser') return;
    const coords = getSvgCoordinates(e);
    if (!coords) return;

    sounds.playClick();
    setIsDrawing(true);

    if (activeTool === 'text') {
      setTextPrompt({ x: coords.x, y: coords.y });
      setTextInput('');
      setIsDrawing(false);
      return;
    }

    if (activeTool === 'horizontal') {
      // Also attach native chart price line for high-fidelity TradingView style
      if (candleSeriesRef.current) {
        try {
          const line = candleSeriesRef.current.createPriceLine({
            price: currentPrice,
            color: drawingColor,
            lineWidth: 1,
            lineStyle: 2,
            axisLabelVisible: true,
            title: `S/R LEVEL`,
          });
          if (line) nativePriceLinesRef.current.push(line);
        } catch {
          // ignore
        }
      }

      const newDrawing: DrawingItem = {
        id: `h-${Date.now()}`,
        type: 'horizontal',
        color: drawingColor,
        points: [{ x: 0, y: coords.y }, { x: coords.width, y: coords.y }],
        priceLevel: currentPrice,
      };
      setDrawings((prev) => [...prev, newDrawing]);
      setIsDrawing(false);
      return;
    }

    const newDrawing: DrawingItem = {
      id: `d-${Date.now()}`,
      type: activeTool,
      color: drawingColor,
      points: [{ x: coords.x, y: coords.y }, { x: coords.x, y: coords.y }],
    };
    setActiveDrawing(newDrawing);
  };

  const handleMouseMove = (e: React.MouseEvent<SVGSVGElement>) => {
    if (!isDrawing || !activeDrawing) return;
    const coords = getSvgCoordinates(e);
    if (!coords) return;

    if (activeDrawing.type === 'brush') {
      setActiveDrawing({
        ...activeDrawing,
        points: [...activeDrawing.points, { x: coords.x, y: coords.y }],
      });
    } else {
      setActiveDrawing({
        ...activeDrawing,
        points: [activeDrawing.points[0], { x: coords.x, y: coords.y }],
      });
    }
  };

  const handleMouseUp = () => {
    if (!isDrawing || !activeDrawing) return;
    setDrawings((prev) => [...prev, activeDrawing]);
    setActiveDrawing(null);
    setIsDrawing(false);
  };

  const handleAddText = () => {
    if (!textPrompt || !textInput.trim()) {
      setTextPrompt(null);
      return;
    }
    const newDrawing: DrawingItem = {
      id: `txt-${Date.now()}`,
      type: 'text',
      color: drawingColor,
      points: [{ x: textPrompt.x, y: textPrompt.y }],
      text: textInput.trim(),
    };
    setDrawings((prev) => [...prev, newDrawing]);
    setTextPrompt(null);
    setTextInput('');
    sounds.playClick();
  };

  const handleDeleteDrawing = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    if (activeTool === 'eraser') {
      setDrawings((prev) => prev.filter((d) => d.id !== id));
      sounds.playClick();
    }
  };

  return (
    <div
      className={`flex flex-col bg-[#0A0E17] border border-white/10 rounded-2xl overflow-hidden shadow-2xl relative ${
        isFullscreen ? 'fixed inset-0 z-50 rounded-none' : 'h-[620px] w-full'
      }`}
    >
      {/* Top TradingView Command Bar */}
      <div className="flex flex-wrap items-center justify-between px-4 py-2.5 bg-[#0E1522] border-b border-white/10 gap-3 text-xs font-mono select-none">
        {/* Symbol & Market Status */}
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2">
            <span className="font-black text-sm text-white tracking-wider">{symbol}</span>
            <span className="text-[11px] text-slate-400 hidden sm:inline truncate max-w-[160px]">{name}</span>
          </div>

          <div className="flex items-center gap-1.5 px-2 py-0.5 rounded-full bg-[#151D2A] border border-white/5">
            <span
              className="w-2 h-2 rounded-full animate-pulse"
              style={{ backgroundColor: isMarketOpen ? '#00FF87' : '#FF3366' }}
            />
            <span className="text-[10px] font-bold" style={{ color: isMarketOpen ? '#00FF87' : '#FF3366' }}>
              {isMarketOpen ? 'LIVE SYNC' : 'CLOSED'}
            </span>
          </div>
        </div>

        {/* OHLC Bar */}
        <div className="hidden xl:flex items-center gap-3 text-[11px] text-slate-400">
          {hoverOHLC ? (
            <>
              <span>O: <strong className="text-white">{currencySymbol}{hoverOHLC.open}</strong></span>
              <span>H: <strong className="text-[#00FF87]">{currencySymbol}{hoverOHLC.high}</strong></span>
              <span>L: <strong className="text-[#FF3366]">{currencySymbol}{hoverOHLC.low}</strong></span>
              <span>C: <strong className="text-white">{currencySymbol}{hoverOHLC.close}</strong></span>
              <span className={`font-bold ${hoverOHLC.change >= 0 ? 'text-[#00FF87]' : 'text-[#FF3366]'}`}>
                {hoverOHLC.change >= 0 ? `+${hoverOHLC.change}%` : `${hoverOHLC.change}%`}
              </span>
            </>
          ) : (
            <>
              <span>LAST: <strong className="text-white">{currencySymbol}{currentPrice}</strong></span>
              <span className="text-slate-500">Hover crosshair for candle details</span>
            </>
          )}
        </div>

        {/* Timeframes and Chart Type Switchers */}
        <div className="flex items-center gap-2">
          {/* Timeframe selector */}
          <div className="flex bg-[#151D2A] p-0.5 rounded-lg border border-white/5">
            {(['1m', '5m', '15m', '1H', '1D', '1W'] as ChartTimeframe[]).map((tf) => (
              <button
                key={tf}
                onClick={() => onTimeframeChange(tf)}
                className={`px-2 py-1 rounded text-[11px] font-bold transition-all ${
                  timeframe === tf ? 'bg-[#00FF87] text-[#0A0E17] shadow-sm' : 'text-slate-400 hover:text-white'
                }`}
              >
                {tf}
              </button>
            ))}
          </div>

          {/* Chart Type Toggle */}
          <div className="flex bg-[#151D2A] p-0.5 rounded-lg border border-white/5">
            <button
              onClick={() => onChartTypeChange('candle')}
              className={`px-2 py-1 rounded text-[11px] font-bold ${
                chartType === 'candle' ? 'bg-white/20 text-white' : 'text-slate-400 hover:text-white'
              }`}
              title="Candlestick Chart"
            >
              Candles
            </button>
            <button
              onClick={() => onChartTypeChange('line')}
              className={`px-2 py-1 rounded text-[11px] font-bold ${
                chartType === 'line' ? 'bg-white/20 text-white' : 'text-slate-400 hover:text-white'
              }`}
              title="Line Chart"
            >
              Line
            </button>
          </div>

          {/* Indicators dropdown / toggles */}
          <div className="hidden md:flex items-center gap-1.5">
            <button
              onClick={() => setShowEMA20(!showEMA20)}
              className={`px-2 py-1 rounded text-[10px] font-bold border transition ${
                showEMA20 ? 'bg-[#00F0FF]/15 text-[#00F0FF] border-[#00F0FF]/40' : 'bg-transparent text-slate-500 border-white/5'
              }`}
            >
              EMA 20
            </button>
            <button
              onClick={() => setShowEMA50(!showEMA50)}
              className={`px-2 py-1 rounded text-[10px] font-bold border transition ${
                showEMA50 ? 'bg-[#FFD700]/15 text-[#FFD700] border-[#FFD700]/40' : 'bg-transparent text-slate-500 border-white/5'
              }`}
            >
              EMA 50
            </button>
            <button
              onClick={() => setShowVolume(!showVolume)}
              className={`px-2 py-1 rounded text-[10px] font-bold border transition ${
                showVolume ? 'bg-[#00FF87]/15 text-[#00FF87] border-[#00FF87]/40' : 'bg-transparent text-slate-500 border-white/5'
              }`}
            >
              VOL
            </button>
          </div>

          {/* Dedicated Clear Drawings Button in the top command bar */}
          <button
            onClick={executeClearAllDrawings}
            title="Clear All Drawings (Accesses Chart API Metadata)"
            className="flex items-center gap-1 px-2.5 py-1 rounded-lg bg-rose-500/10 hover:bg-rose-500 text-rose-300 hover:text-white border border-rose-500/20 text-[11px] font-bold transition"
          >
            <Trash2 className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Clear Drawings</span>
            {drawings.length > 0 && (
              <span className="ml-1 px-1.5 py-0.2 rounded-full bg-rose-950 text-[10px] font-extrabold border border-rose-500/40">
                {drawings.length}
              </span>
            )}
          </button>

          {/* Fullscreen Button */}
          <button
            onClick={() => setIsFullscreen(!isFullscreen)}
            className="p-1.5 bg-[#151D2A] hover:bg-[#1E293B] text-slate-400 hover:text-white rounded-lg border border-white/5 transition"
            title={isFullscreen ? 'Exit Fullscreen' : 'Fullscreen Chart'}
          >
            {isFullscreen ? <Minimize2 className="w-3.5 h-3.5" /> : <Maximize2 className="w-3.5 h-3.5" />}
          </button>
        </div>
      </div>

      {/* Main Workspace (Left Drawing Toolbar + Center Chart Container) */}
      <div className="relative flex-grow flex overflow-hidden">
        {/* Left Drawing Tools Palette */}
        <div className="w-12 bg-[#0E1522] border-r border-white/10 flex flex-col items-center py-3 gap-2 shrink-0 z-20">
          {/* Tool buttons */}
          {[
            { id: 'cursor', icon: Crosshair, label: 'Crosshair / Select' },
            { id: 'trendline', icon: Slash, label: 'Trendline' },
            { id: 'horizontal', icon: Minus, label: 'Support / Resistance Level' },
            { id: 'fib', icon: TrendingUp, label: 'Fibonacci Retracement' },
            { id: 'rectangle', icon: Square, label: 'Order Block / Zone' },
            { id: 'ruler', icon: Ruler, label: 'Measurement Ruler' },
            { id: 'brush', icon: Pencil, label: 'Freehand Brush' },
            { id: 'text', icon: Type, label: 'Text Callout' },
          ].map((tool) => {
            const Icon = tool.icon;
            const isSelected = activeTool === tool.id;
            return (
              <button
                key={tool.id}
                onClick={() => {
                  setActiveTool(tool.id as DrawingToolType);
                  sounds.playClick();
                }}
                title={tool.label}
                className={`p-2 rounded-xl transition relative group ${
                  isSelected
                    ? 'bg-[#00FF87] text-[#0A0E17] shadow-[0_0_10px_rgba(0,255,135,0.4)]'
                    : 'text-slate-400 hover:text-white hover:bg-[#151D2A]'
                }`}
              >
                <Icon className="w-4 h-4" />
                <span className="absolute left-14 top-1/2 -translate-y-1/2 bg-[#151D2A] border border-white/10 text-white text-[10px] px-2 py-1 rounded whitespace-nowrap opacity-0 group-hover:opacity-100 transition pointer-events-none z-30 shadow-lg">
                  {tool.label}
                </span>
              </button>
            );
          })}

          <div className="w-6 h-[1px] bg-white/10 my-1" />

          {/* Color palette selector */}
          <div className="flex flex-col gap-1.5 items-center">
            {['#00FF87', '#FF3366', '#00F0FF', '#FFD700', '#FFFFFF'].map((c) => (
              <button
                key={c}
                onClick={() => setDrawingColor(c)}
                className={`w-3.5 h-3.5 rounded-full transition-transform ${
                  drawingColor === c ? 'scale-125 ring-2 ring-white/50' : 'opacity-70 hover:opacity-100'
                }`}
                style={{ backgroundColor: c }}
              />
            ))}
          </div>

          <div className="flex-grow" />

          {/* Eraser Tool */}
          <button
            onClick={() => setActiveTool(activeTool === 'eraser' ? 'cursor' : 'eraser')}
            title="Eraser (Click any drawing to delete)"
            className={`p-2 rounded-xl transition ${
              activeTool === 'eraser'
                ? 'bg-[#FF3366] text-white shadow-[0_0_10px_rgba(255,51,102,0.4)]'
                : 'text-slate-400 hover:text-white hover:bg-[#151D2A]'
            }`}
          >
            <Minus className="w-4 h-4" />
          </button>

          {/* One-Click Cleanup Button */}
          <button
            onClick={executeClearAllDrawings}
            title="Clear All Drawings (Wipes Metadata & Native Chart Lines)"
            className="p-2 text-rose-400 hover:text-white hover:bg-rose-500/20 rounded-xl transition group relative"
          >
            <Trash2 className="w-4 h-4" />
            <span className="absolute left-14 top-1/2 -translate-y-1/2 bg-[#FF3366] text-white font-mono font-bold text-[10px] px-2.5 py-1 rounded whitespace-nowrap opacity-0 group-hover:opacity-100 transition pointer-events-none z-30 shadow-lg uppercase">
              Clear All Drawings
            </span>
          </button>
        </div>

        {/* Center Canvas Workspace */}
        <div className="relative flex-grow h-full w-full bg-[#0A0E17]">
          {/* Lightweight Charts HTML5 Canvas Mount */}
          <div ref={chartContainerRef} className="absolute inset-0 w-full h-full" />

          {/* High-Performance SVG Drawing Overlay */}
          <svg
            ref={svgRef}
            onMouseDown={handleMouseDown}
            onMouseMove={handleMouseMove}
            onMouseUp={handleMouseUp}
            className={`absolute inset-0 w-full h-full ${
              activeTool !== 'cursor' ? 'cursor-crosshair z-10' : 'pointer-events-none z-10'
            }`}
          >
            {/* Render saved drawings */}
            {drawings.map((d) => {
              if (d.type === 'trendline' && d.points.length >= 2) {
                return (
                  <g key={d.id} onClick={(e) => handleDeleteDrawing(d.id, e)} className="pointer-events-auto cursor-pointer group">
                    <line
                      x1={d.points[0].x}
                      y1={d.points[0].y}
                      x2={d.points[1].x}
                      y2={d.points[1].y}
                      stroke={d.color}
                      strokeWidth="2"
                    />
                    <circle cx={d.points[0].x} cy={d.points[0].y} r="3" fill={d.color} />
                    <circle cx={d.points[1].x} cy={d.points[1].y} r="3" fill={d.color} />
                  </g>
                );
              }

              if (d.type === 'horizontal' && d.points.length >= 1) {
                const y = d.points[0].y;
                return (
                  <g key={d.id} onClick={(e) => handleDeleteDrawing(d.id, e)} className="pointer-events-auto cursor-pointer">
                    <line x1="0" y1={y} x2="100%" y2={y} stroke={d.color} strokeWidth="1.5" strokeDasharray="4 3" />
                    <rect x="10" y={y - 10} width="90" height="20" rx="4" fill="#151D2A" stroke={d.color} strokeWidth="1" />
                    <text x="16" y={y + 4} fill={d.color} fontSize="10" fontFamily="monospace" fontWeight="bold">
                      S/R Level
                    </text>
                  </g>
                );
              }

              if (d.type === 'fib' && d.points.length >= 2) {
                const y1 = d.points[0].y;
                const y2 = d.points[1].y;
                const levels = [
                  { pct: 0, label: '0.0% (1.000)', color: '#FF3366' },
                  { pct: 0.236, label: '23.6%', color: '#FFA500' },
                  { pct: 0.382, label: '38.2%', color: '#FFD700' },
                  { pct: 0.5, label: '50.0% (EQ)', color: '#00F0FF' },
                  { pct: 0.618, label: '61.8% (Golden Pocket)', color: '#00FF87' },
                  { pct: 0.786, label: '78.6%', color: '#00BFFF' },
                  { pct: 1.0, label: '100.0%', color: '#9370DB' },
                ];
                return (
                  <g key={d.id} onClick={(e) => handleDeleteDrawing(d.id, e)} className="pointer-events-auto cursor-pointer">
                    {levels.map((lvl) => {
                      const curY = y1 + (y2 - y1) * lvl.pct;
                      return (
                        <g key={lvl.pct}>
                          <line x1="0" y1={curY} x2="100%" y2={curY} stroke={lvl.color} strokeWidth="1" strokeDasharray="3 3" opacity="0.85" />
                          <rect x="10" y={curY - 9} width="110" height="18" rx="3" fill="#0A0E17" opacity="0.8" />
                          <text x="14" y={curY + 3} fill={lvl.color} fontSize="9" fontFamily="monospace" fontWeight="bold">
                            {lvl.label}
                          </text>
                        </g>
                      );
                    })}
                  </g>
                );
              }

              if (d.type === 'rectangle' && d.points.length >= 2) {
                const x = Math.min(d.points[0].x, d.points[1].x);
                const y = Math.min(d.points[0].y, d.points[1].y);
                const w = Math.abs(d.points[1].x - d.points[0].x);
                const h = Math.abs(d.points[1].y - d.points[0].y);
                return (
                  <g key={d.id} onClick={(e) => handleDeleteDrawing(d.id, e)} className="pointer-events-auto cursor-pointer">
                    <rect x={x} y={y} width={w} height={h} fill={d.color} fillOpacity="0.15" stroke={d.color} strokeWidth="1.5" />
                    <text x={x + 6} y={y + 14} fill={d.color} fontSize="10" fontFamily="monospace" fontWeight="bold">
                      Order Block
                    </text>
                  </g>
                );
              }

              if (d.type === 'ruler' && d.points.length >= 2) {
                const p1 = d.points[0];
                const p2 = d.points[1];
                const deltaY = p1.y - p2.y;
                const pct = ((deltaY / 200) * 2.5).toFixed(2);
                return (
                  <g key={d.id} onClick={(e) => handleDeleteDrawing(d.id, e)} className="pointer-events-auto cursor-pointer">
                    <line x1={p1.x} y1={p1.y} x2={p2.x} y2={p2.y} stroke="#00F0FF" strokeWidth="2" strokeDasharray="4 2" />
                    <rect x={p2.x + 8} y={p2.y - 12} width="80" height="24" rx="4" fill="#0E1522" stroke="#00F0FF" strokeWidth="1" />
                    <text x={p2.x + 14} y={p2.y + 4} fill="#00F0FF" fontSize="10" fontFamily="monospace" fontWeight="bold">
                      Δ {pct}%
                    </text>
                  </g>
                );
              }

              if (d.type === 'brush' && d.points.length >= 2) {
                const pathData = d.points.reduce((acc, pt, i) => `${acc} ${i === 0 ? 'M' : 'L'} ${pt.x} ${pt.y}`, '');
                return (
                  <path
                    key={d.id}
                    d={pathData}
                    stroke={d.color}
                    strokeWidth="2"
                    fill="none"
                    onClick={(e) => handleDeleteDrawing(d.id, e)}
                    className="pointer-events-auto cursor-pointer"
                  />
                );
              }

              if (d.type === 'text' && d.points.length >= 1 && d.text) {
                const pt = d.points[0];
                return (
                  <g key={d.id} onClick={(e) => handleDeleteDrawing(d.id, e)} className="pointer-events-auto cursor-pointer">
                    <rect x={pt.x - 4} y={pt.y - 14} width={(d.text.length * 7) + 12} height="20" rx="4" fill="#151D2A" stroke={d.color} strokeWidth="1" />
                    <text x={pt.x + 2} y={pt.y} fill={d.color} fontSize="11" fontFamily="monospace" fontWeight="bold">
                      {d.text}
                    </text>
                  </g>
                );
              }

              return null;
            })}

            {/* Render active dragging drawing */}
            {activeDrawing && (
              <g>
                {activeDrawing.type === 'trendline' && activeDrawing.points.length >= 2 && (
                  <line
                    x1={activeDrawing.points[0].x}
                    y1={activeDrawing.points[0].y}
                    x2={activeDrawing.points[1].x}
                    y2={activeDrawing.points[1].y}
                    stroke={activeDrawing.color}
                    strokeWidth="2"
                  />
                )}
                {activeDrawing.type === 'rectangle' && activeDrawing.points.length >= 2 && (
                  <rect
                    x={Math.min(activeDrawing.points[0].x, activeDrawing.points[1].x)}
                    y={Math.min(activeDrawing.points[0].y, activeDrawing.points[1].y)}
                    width={Math.abs(activeDrawing.points[1].x - activeDrawing.points[0].x)}
                    height={Math.abs(activeDrawing.points[1].y - activeDrawing.points[0].y)}
                    fill={activeDrawing.color}
                    fillOpacity="0.2"
                    stroke={activeDrawing.color}
                    strokeWidth="1.5"
                  />
                )}
                {activeDrawing.type === 'ruler' && activeDrawing.points.length >= 2 && (
                  <line
                    x1={activeDrawing.points[0].x}
                    y1={activeDrawing.points[0].y}
                    x2={activeDrawing.points[1].x}
                    y2={activeDrawing.points[1].y}
                    stroke="#00F0FF"
                    strokeWidth="2"
                    strokeDasharray="3 3"
                  />
                )}
                {activeDrawing.type === 'fib' && activeDrawing.points.length >= 2 && (
                  <line
                    x1="0"
                    y1={activeDrawing.points[0].y}
                    x2="100%"
                    y2={activeDrawing.points[1].y}
                    stroke={activeDrawing.color}
                    strokeWidth="1.5"
                    strokeDasharray="2 2"
                  />
                )}
                {activeDrawing.type === 'brush' && activeDrawing.points.length >= 2 && (
                  <path
                    d={activeDrawing.points.reduce((acc, pt, i) => `${acc} ${i === 0 ? 'M' : 'L'} ${pt.x} ${pt.y}`, '')}
                    stroke={activeDrawing.color}
                    strokeWidth="2"
                    fill="none"
                  />
                )}
              </g>
            )}
          </svg>

          {/* Text Annotation Prompt Input */}
          {textPrompt && (
            <div
              className="absolute z-30 bg-[#151D2A] border border-[#00FF87] p-2 rounded-lg shadow-2xl flex items-center gap-2"
              style={{ left: textPrompt.x, top: textPrompt.y }}
            >
              <input
                type="text"
                autoFocus
                value={textInput}
                onChange={(e) => setTextInput(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') handleAddText();
                  if (e.key === 'Escape') setTextPrompt(null);
                }}
                placeholder="Annotation text..."
                className="bg-[#0A0E17] border border-white/10 rounded px-2 py-1 text-xs text-white focus:outline-none focus:border-[#00FF87] min-w-[140px]"
              />
              <button
                onClick={handleAddText}
                className="px-2.5 py-1 bg-[#00FF87] text-[#0A0E17] font-mono font-bold text-xs rounded"
              >
                Add
              </button>
            </div>
          )}

          {/* Quick Floating Reset / Clear Drawings Button */}
          {drawings.length > 0 && (
            <div className="absolute bottom-4 right-20 z-20">
              <button
                onClick={executeClearAllDrawings}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-[#151D2A]/90 hover:bg-[#FF3366] text-slate-300 hover:text-white border border-white/10 hover:border-[#FF3366] text-xs font-mono font-bold backdrop-blur-md transition shadow-lg"
              >
                <Trash2 className="w-3.5 h-3.5" />
                <span>Clear {drawings.length} Drawings</span>
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
});
