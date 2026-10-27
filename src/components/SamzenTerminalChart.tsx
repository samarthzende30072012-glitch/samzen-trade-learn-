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
  Pencil, Sparkles, SlidersHorizontal, Eye, EyeOff,
  ChevronDown, X
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

interface SamzenTerminalChartProps {
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
  theme?: 'dark' | 'light';
}

export interface SamzenTerminalChartRef {
  updateTick: (price: number) => void;
  getDrawingMetadata: () => DrawingMetadata;
  clearAllDrawings: () => { clearedCount: number; clearedTypes: string[] };
  setDrawingTool: (tool: DrawingToolType) => void;
  addQuickHorizontalLevel: (price?: number) => void;
  getChartApi: () => IChartApi | null;
  getSeriesApi: () => ISeriesApi<'Candlestick'> | null;
}

export const SamzenTerminalChart = forwardRef<SamzenTerminalChartRef, SamzenTerminalChartProps>(({
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
  theme = 'dark',
}, ref) => {
  const chartContainerRef = useRef<HTMLDivElement | null>(null);
  const chartInstanceRef = useRef<IChartApi | null>(null);
  const candleSeriesRef = useRef<ISeriesApi<'Candlestick'> | null>(null);
  const lineSeriesRef = useRef<ISeriesApi<'Line'> | null>(null);
  const volumeSeriesRef = useRef<ISeriesApi<'Histogram'> | null>(null);
  const ema20SeriesRef = useRef<ISeriesApi<'Line'> | null>(null);
  const ema50SeriesRef = useRef<ISeriesApi<'Line'> | null>(null);

  // Native price line references
  const nativePriceLinesRef = useRef<any[]>([]);

  // Candles data state
  const candlesRef = useRef<CandleData[]>([]);

  // Progressive Disclosure: Keep drawing tools & indicators hidden by default!
  const [isToolsOpen, setIsToolsOpen] = useState(false);
  const [showEMA20, setShowEMA20] = useState(false);
  const [showEMA50, setShowEMA50] = useState(false);
  const [showVolume, setShowVolume] = useState(true);

  // Hover OHLC state
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

  useEffect(() => {
    const meta = calculateDrawingMetadata(drawings);
    onDrawingMetadataChange?.(meta);
  }, [drawings]);

  useEffect(() => {
    try {
      localStorage.setItem(`samzen_drawings_${symbol}`, JSON.stringify(drawings));
    } catch {
      // ignore
    }
  }, [drawings, symbol]);

  useEffect(() => {
    try {
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
                title: 'LEVEL',
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

  const generateHistory = (basePrice: number, tf: ChartTimeframe): CandleData[] => {
    const count = 100;
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

    if (result.length > 0) {
      const last = result[result.length - 1];
      last.close = currentPrice;
      last.high = Math.max(last.high, currentPrice);
      last.low = Math.min(last.low, currentPrice);
    }

    return result;
  };

  // Mount Chart
  useEffect(() => {
    if (!chartContainerRef.current) return;

    if (chartInstanceRef.current) {
      chartInstanceRef.current.remove();
      chartInstanceRef.current = null;
    }

    const isLight = theme === 'light';
    const container = chartContainerRef.current;
    const chart = createChart(container, {
      layout: {
        background: { type: ColorType.Solid, color: isLight ? '#FFFFFF' : '#0A0E17' },
        textColor: isLight ? '#475569' : '#94A3B8',
        fontFamily: "'JetBrains Mono', monospace",
        fontSize: 11,
      },
      grid: {
        vertLines: { color: isLight ? 'rgba(0, 0, 0, 0.05)' : 'rgba(255, 255, 255, 0.03)' },
        horzLines: { color: isLight ? 'rgba(0, 0, 0, 0.05)' : 'rgba(255, 255, 255, 0.03)' },
      },
      crosshair: {
        mode: CrosshairMode.Normal,
        vertLine: {
          color: isLight ? 'rgba(5, 150, 105, 0.4)' : 'rgba(0, 255, 135, 0.3)',
          width: 1,
          style: 2,
        },
        horzLine: {
          color: isLight ? 'rgba(5, 150, 105, 0.4)' : 'rgba(0, 255, 135, 0.3)',
          width: 1,
          style: 2,
        },
      },
      rightPriceScale: {
        borderColor: isLight ? 'rgba(0, 0, 0, 0.08)' : 'rgba(255, 255, 255, 0.08)',
        scaleMargins: {
          top: 0.08,
          bottom: 0.15,
        },
      },
      timeScale: {
        borderColor: isLight ? 'rgba(0, 0, 0, 0.08)' : 'rgba(255, 255, 255, 0.08)',
        timeVisible: true,
        secondsVisible: false,
      },
      handleScroll: true,
      handleScale: true,
    });

    chartInstanceRef.current = chart;

    // Volume Series
    const volumeSeries = chart.addSeries(HistogramSeries, {
      color: 'rgba(0, 255, 135, 0.15)',
      priceFormat: { type: 'volume' },
      priceScaleId: '',
    });
    volumeSeries.priceScale().applyOptions({
      scaleMargins: { top: 0.82, bottom: 0 },
    });
    volumeSeriesRef.current = volumeSeries;

    // Proprietary Candlestick Series: Emerald Green & Crimson
    const candleSeries = chart.addSeries(CandlestickSeries, {
      upColor: '#00FF87',
      downColor: '#FF3366',
      borderVisible: false,
      wickUpColor: '#00FF87',
      wickDownColor: '#FF3366',
    });
    candleSeriesRef.current = candleSeries;

    // Line Series
    const lineSeries = chart.addSeries(LineSeries, {
      color: '#00FF87',
      lineWidth: 2,
      visible: chartType === 'line',
    });
    lineSeriesRef.current = lineSeries;

    // EMA Series
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

    const initialCandles = generateHistory(currentPrice, timeframe);
    candlesRef.current = initialCandles;

    candleSeries.setData(initialCandles);
    lineSeries.setData(initialCandles.map((c) => ({ time: c.time, value: c.close })));

    volumeSeries.setData(
      initialCandles.map((c) => ({
        time: c.time,
        value: c.volume || 1000,
        color: c.close >= c.open ? 'rgba(0, 255, 135, 0.25)' : 'rgba(255, 51, 102, 0.25)',
      }))
    );

    if (showEMA20) ema20.setData(calculateEMA(initialCandles, 20));
    if (showEMA50) ema50.setData(calculateEMA(initialCandles, 50));

    // OHLC Hover
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

    const handleResize = () => {
      if (container && chart) {
        const w = container.clientWidth || container.parentElement?.clientWidth || 600;
        const h = container.clientHeight || container.parentElement?.clientHeight || 450;
        if (w > 0 && h > 0) {
          chart.applyOptions({
            width: w,
            height: h,
          });
        }
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

  // Sync Chart Mode
  useEffect(() => {
    if (candleSeriesRef.current && lineSeriesRef.current) {
      candleSeriesRef.current.applyOptions({ visible: chartType === 'candle' });
      lineSeriesRef.current.applyOptions({ visible: chartType === 'line' });
    }
  }, [chartType]);

  // Sync EMAs
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

  // Sync Volume
  useEffect(() => {
    if (volumeSeriesRef.current) {
      volumeSeriesRef.current.applyOptions({ visible: showVolume });
    }
  }, [showVolume]);

  // Sync Theme
  useEffect(() => {
    if (!chartInstanceRef.current) return;
    const isLight = theme === 'light';
    chartInstanceRef.current.applyOptions({
      layout: {
        background: { type: ColorType.Solid, color: isLight ? '#FFFFFF' : '#0A0E17' },
        textColor: isLight ? '#475569' : '#94A3B8',
      },
      grid: {
        vertLines: { color: isLight ? 'rgba(0, 0, 0, 0.05)' : 'rgba(255, 255, 255, 0.03)' },
        horzLines: { color: isLight ? 'rgba(0, 0, 0, 0.05)' : 'rgba(255, 255, 255, 0.03)' },
      },
      rightPriceScale: {
        borderColor: isLight ? 'rgba(0, 0, 0, 0.08)' : 'rgba(255, 255, 255, 0.08)',
      },
      timeScale: {
        borderColor: isLight ? 'rgba(0, 0, 0, 0.08)' : 'rgba(255, 255, 255, 0.08)',
      },
    });
  }, [theme]);

  // Clear all drawings execution
  const executeClearAllDrawings = () => {
    const typesSet = new Set(drawings.map((d) => d.type));
    const clearedTypes = Array.from(typesSet);
    const clearedCount = drawings.length;

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

    setDrawings([]);
    setActiveDrawing(null);
    setTextPrompt(null);
    try {
      localStorage.removeItem(`samzen_drawings_${symbol}`);
    } catch {
      // ignore
    }

    sounds.playWhoosh();
    onDrawingMetadataChange?.(calculateDrawingMetadata([]));
    return { clearedCount, clearedTypes };
  };

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
          color: newPrice >= lastCandle.open ? 'rgba(0, 255, 135, 0.3)' : 'rgba(255, 51, 102, 0.3)',
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
      setIsToolsOpen(true);
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
            title: `LEVEL @ ${p}`,
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
        points: [{ x: 0, y: 120 }, { x: 500, y: 120 }],
        priceLevel: p,
      };

      setDrawings((prev) => [...prev, newDrawing]);
      sounds.playClick();
    },
    getChartApi: () => chartInstanceRef.current,
    getSeriesApi: () => candleSeriesRef.current,
  }));

  // SVG Drawing Handling
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
      if (candleSeriesRef.current) {
        try {
          const line = candleSeriesRef.current.createPriceLine({
            price: currentPrice,
            color: drawingColor,
            lineWidth: 1,
            lineStyle: 2,
            axisLabelVisible: true,
            title: `S/R`,
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

  const isLight = theme === 'light';

  return (
    <div
      className={`flex flex-col rounded-2xl overflow-hidden shadow-2xl relative transition-colors ${
        isFullscreen ? 'fixed inset-0 z-50 rounded-none' : 'h-[580px] w-full'
      } ${isLight ? 'bg-white border border-slate-200 text-slate-800' : 'bg-[#0A0E17] border border-white/10 text-white'}`}
    >
      {/* Sleek, Uncluttered Proprietary Header Bar */}
      <div className={`flex flex-wrap items-center justify-between px-4 py-2 border-b gap-2 text-xs font-mono select-none ${
        isLight ? 'bg-slate-50/90 border-slate-200 text-slate-800' : 'bg-[#0A0E17] border-white/5 text-white'
      }`}>
        {/* Left: Proprietary Asset Info & Live Badge */}
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2">
            <span className={`font-black text-sm tracking-wider ${isLight ? 'text-slate-900' : 'text-white'}`}>{symbol}</span>
            <span className="text-[11px] text-slate-400 hidden md:inline truncate max-w-[140px]">{name}</span>
          </div>

          <div className={`flex items-center gap-1.5 px-2 py-0.5 rounded-full border ${
            isLight ? 'bg-slate-100 border-slate-200' : 'bg-[#121A28] border-white/5'
          }`}>
            <span
              className="w-1.5 h-1.5 rounded-full animate-pulse"
              style={{ backgroundColor: isMarketOpen ? (isLight ? '#059669' : '#00FF87') : (isLight ? '#E11D48' : '#FF3366') }}
            />
            <span className="text-[10px] font-bold" style={{ color: isMarketOpen ? (isLight ? '#059669' : '#00FF87') : (isLight ? '#E11D48' : '#FF3366') }}>
              {isMarketOpen ? 'LIVE' : 'CLOSED'}
            </span>
          </div>
        </div>

        {/* Center: Live OHLC Display */}
        <div className="hidden lg:flex items-center gap-3 text-[11px] text-slate-500">
          {hoverOHLC ? (
            <>
              <span>O: <strong className={isLight ? 'text-slate-900' : 'text-white'}>{currencySymbol}{hoverOHLC.open}</strong></span>
              <span>H: <strong className={isLight ? 'text-emerald-600' : 'text-[#00FF87]'}>{currencySymbol}{hoverOHLC.high}</strong></span>
              <span>L: <strong className={isLight ? 'text-rose-600' : 'text-[#FF3366]'}>{currencySymbol}{hoverOHLC.low}</strong></span>
              <span>C: <strong className={isLight ? 'text-slate-900' : 'text-white'}>{currencySymbol}{hoverOHLC.close}</strong></span>
              <span className={`font-bold ${hoverOHLC.change >= 0 ? (isLight ? 'text-emerald-600' : 'text-[#00FF87]') : (isLight ? 'text-rose-600' : 'text-[#FF3366]')}`}>
                {hoverOHLC.change >= 0 ? `+${hoverOHLC.change}%` : `${hoverOHLC.change}%`}
              </span>
            </>
          ) : (
            <>
              <span>LAST: <strong className={isLight ? 'text-slate-900' : 'text-white'}>{currencySymbol}{currentPrice}</strong></span>
            </>
          )}
        </div>

        {/* Right: Timeframes & Progressive Disclosure Toggle */}
        <div className="flex items-center gap-2">
          {/* Timeframe selector */}
          <div className={`flex p-0.5 rounded-lg border ${isLight ? 'bg-slate-100 border-slate-200' : 'bg-[#121A28] border-white/5'}`}>
            {(['1m', '5m', '15m', '1H', '1D'] as ChartTimeframe[]).map((tf) => (
              <button
                key={tf}
                onClick={() => onTimeframeChange(tf)}
                className={`px-2 py-1 rounded text-[11px] font-bold transition-all cursor-pointer ${
                  timeframe === tf
                    ? (isLight ? 'bg-emerald-600 text-white shadow-sm font-black' : 'bg-[#00FF87] text-[#0A0E17] shadow-sm font-black')
                    : (isLight ? 'text-slate-600 hover:text-slate-900' : 'text-slate-400 hover:text-white')
                }`}
              >
                {tf}
              </button>
            ))}
          </div>

          {/* Chart Mode */}
          <div className={`flex p-0.5 rounded-lg border ${isLight ? 'bg-slate-100 border-slate-200' : 'bg-[#121A28] border-white/5'}`}>
            <button
              onClick={() => onChartTypeChange('candle')}
              className={`px-2 py-1 rounded text-[11px] font-bold cursor-pointer ${
                chartType === 'candle' ? (isLight ? 'bg-white text-slate-900 shadow-xs' : 'bg-white/15 text-white') : (isLight ? 'text-slate-600 hover:text-slate-900' : 'text-slate-400 hover:text-white')
              }`}
            >
              Candles
            </button>
            <button
              onClick={() => onChartTypeChange('line')}
              className={`px-2 py-1 rounded text-[11px] font-bold cursor-pointer ${
                chartType === 'line' ? (isLight ? 'bg-white text-slate-900 shadow-xs' : 'bg-white/15 text-white') : (isLight ? 'text-slate-600 hover:text-slate-900' : 'text-slate-400 hover:text-white')
              }`}
            >
              Line
            </button>
          </div>

          {/* Progressive Disclosure: Drawing Tools Toggle Button */}
          <button
            onClick={() => {
              setIsToolsOpen(!isToolsOpen);
              sounds.playClick();
            }}
            className={`flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-[11px] font-bold transition cursor-pointer border ${
              isToolsOpen
                ? (isLight ? 'bg-emerald-50 text-emerald-700 border-emerald-300' : 'bg-[#00FF87]/20 text-[#00FF87] border-[#00FF87]/40 shadow-sm')
                : (isLight ? 'bg-slate-100 text-slate-700 hover:text-slate-900 border-slate-200' : 'bg-[#121A28] text-slate-300 hover:text-white border-white/5')
            }`}
            title="Toggle Drawing Tools & Technical Indicators"
          >
            <Pencil className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Tools</span>
            {drawings.length > 0 && (
              <span className={`w-2 h-2 rounded-full animate-pulse ${isLight ? 'bg-emerald-600' : 'bg-[#00FF87]'}`} />
            )}
          </button>

          {/* Fullscreen */}
          <button
            onClick={() => setIsFullscreen(!isFullscreen)}
            className={`p-1.5 rounded-lg border transition cursor-pointer ${
              isLight ? 'bg-slate-100 hover:bg-slate-200 text-slate-600 border-slate-200' : 'bg-[#121A28] hover:bg-[#1E293B] text-slate-400 hover:text-white border-white/5'
            }`}
            title={isFullscreen ? 'Exit Fullscreen' : 'Fullscreen'}
          >
            {isFullscreen ? <Minimize2 className="w-3.5 h-3.5" /> : <Maximize2 className="w-3.5 h-3.5" />}
          </button>
        </div>
      </div>

      {/* Main Interactive Workspace */}
      <div className="relative flex-grow flex overflow-hidden">
        {/* Sleek Collapsible Drawing Tools Sidebar (Progressive Disclosure) */}
        {isToolsOpen && (
          <div className={`w-12 border-r flex flex-col items-center py-3 gap-2 shrink-0 z-20 backdrop-blur-md animate-in slide-in-from-left duration-150 ${
            isLight ? 'bg-white/95 border-slate-200' : 'bg-[#0A0E17]/95 border-white/10'
          }`}>
            {[
              { id: 'cursor', icon: Crosshair, label: 'Crosshair / Select' },
              { id: 'trendline', icon: Slash, label: 'Trendline' },
              { id: 'horizontal', icon: Minus, label: 'Support / Resistance Level' },
              { id: 'fib', icon: TrendingUp, label: 'Fibonacci Retracement' },
              { id: 'rectangle', icon: Square, label: 'Order Block / Zone' },
              { id: 'ruler', icon: Ruler, label: 'Measurement Ruler' },
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
                  className={`p-2 rounded-xl transition relative group cursor-pointer ${
                    isSelected
                      ? (isLight ? 'bg-emerald-600 text-white shadow-sm' : 'bg-[#00FF87] text-[#0A0E17] shadow-[0_0_10px_rgba(0,255,135,0.4)]')
                      : (isLight ? 'text-slate-500 hover:text-slate-900 hover:bg-slate-100' : 'text-slate-400 hover:text-white hover:bg-[#121A28]')
                  }`}
                >
                  <Icon className="w-4 h-4" />
                  <span className={`absolute left-14 top-1/2 -translate-y-1/2 border text-[10px] px-2 py-1 rounded whitespace-nowrap opacity-0 group-hover:opacity-100 transition pointer-events-none z-30 shadow-lg ${
                    isLight ? 'bg-white border-slate-200 text-slate-800' : 'bg-[#121A28] border-white/10 text-white'
                  }`}>
                    {tool.label}
                  </span>
                </button>
              );
            })}

            <div className={`w-6 h-[1px] my-1 ${isLight ? 'bg-slate-200' : 'bg-white/10'}`} />

            {/* Color selection */}
            <div className="flex flex-col gap-1.5 items-center">
              {['#00FF87', '#FF3366', '#00F0FF', '#FFD700', '#FFFFFF'].map((c) => (
                <button
                  key={c}
                  onClick={() => setDrawingColor(c)}
                  className={`w-3.5 h-3.5 rounded-full transition-transform cursor-pointer ${
                    drawingColor === c ? 'scale-125 ring-2 ring-slate-400' : 'opacity-70 hover:opacity-100'
                  }`}
                  style={{ backgroundColor: c }}
                />
              ))}
            </div>

            <div className="flex-grow" />

            {/* Eraser */}
            <button
              onClick={() => setActiveTool(activeTool === 'eraser' ? 'cursor' : 'eraser')}
              title="Eraser (Click any drawing to delete)"
              className={`p-2 rounded-xl transition cursor-pointer ${
                activeTool === 'eraser'
                  ? 'bg-[#FF3366] text-white shadow-[0_0_10px_rgba(255,51,102,0.4)]'
                  : (isLight ? 'text-slate-500 hover:text-slate-900 hover:bg-slate-100' : 'text-slate-400 hover:text-white hover:bg-[#121A28]')
              }`}
            >
              <Minus className="w-4 h-4" />
            </button>

            {/* Dedicated Clear Drawings Button */}
            <button
              onClick={executeClearAllDrawings}
              title="Clear All Drawings (One-Click Clean)"
              className="p-2 text-rose-500 hover:text-white hover:bg-rose-600 rounded-xl transition cursor-pointer group relative"
            >
              <Trash2 className="w-4 h-4" />
              <span className="absolute left-14 top-1/2 -translate-y-1/2 bg-[#FF3366] text-white font-mono font-bold text-[10px] px-2.5 py-1 rounded whitespace-nowrap opacity-0 group-hover:opacity-100 transition pointer-events-none z-30 shadow-lg uppercase">
                Clear All Drawings
              </span>
            </button>
          </div>
        )}

        {/* Center Canvas */}
        <div className={`relative flex-grow h-full w-full ${isLight ? 'bg-white' : 'bg-[#0A0E17]'}`}>
          {/* Canvas Mount */}
          <div ref={chartContainerRef} className="absolute inset-0 w-full h-full" />

          {/* SVG Overlay */}
          <svg
            ref={svgRef}
            onMouseDown={handleMouseDown}
            onMouseMove={handleMouseMove}
            onMouseUp={handleMouseUp}
            className={`absolute inset-0 w-full h-full ${
              activeTool !== 'cursor' ? 'cursor-crosshair z-10' : 'pointer-events-none z-10'
            }`}
          >
            {drawings.map((d) => {
              if (d.type === 'trendline' && d.points.length >= 2) {
                return (
                  <g key={d.id} onClick={(e) => handleDeleteDrawing(d.id, e)} className="pointer-events-auto cursor-pointer">
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
                    <rect x="10" y={y - 10} width="70" height="20" rx="4" fill="#0A0E17" stroke={d.color} strokeWidth="1" />
                    <text x="16" y={y + 4} fill={d.color} fontSize="10" fontFamily="monospace" fontWeight="bold">
                      LEVEL
                    </text>
                  </g>
                );
              }

              if (d.type === 'fib' && d.points.length >= 2) {
                const y1 = d.points[0].y;
                const y2 = d.points[1].y;
                const levels = [
                  { pct: 0, label: '0.0%', color: '#FF3366' },
                  { pct: 0.382, label: '38.2%', color: '#FFD700' },
                  { pct: 0.5, label: '50.0% EQ', color: '#00F0FF' },
                  { pct: 0.618, label: '61.8% Golden', color: '#00FF87' },
                  { pct: 1.0, label: '100.0%', color: '#9370DB' },
                ];
                return (
                  <g key={d.id} onClick={(e) => handleDeleteDrawing(d.id, e)} className="pointer-events-auto cursor-pointer">
                    {levels.map((lvl) => {
                      const curY = y1 + (y2 - y1) * lvl.pct;
                      return (
                        <g key={lvl.pct}>
                          <line x1="0" y1={curY} x2="100%" y2={curY} stroke={lvl.color} strokeWidth="1" strokeDasharray="3 3" opacity="0.8" />
                          <rect x="10" y={curY - 9} width="85" height="18" rx="3" fill="#0A0E17" opacity="0.8" />
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
                    <rect x={p2.x + 8} y={p2.y - 12} width="75" height="22" rx="4" fill="#0E1522" stroke="#00F0FF" strokeWidth="1" />
                    <text x={p2.x + 14} y={p2.y + 4} fill="#00F0FF" fontSize="10" fontFamily="monospace" fontWeight="bold">
                      Δ {pct}%
                    </text>
                  </g>
                );
              }

              if (d.type === 'text' && d.points.length >= 1 && d.text) {
                const pt = d.points[0];
                return (
                  <g key={d.id} onClick={(e) => handleDeleteDrawing(d.id, e)} className="pointer-events-auto cursor-pointer">
                    <rect x={pt.x - 4} y={pt.y - 14} width={(d.text.length * 7) + 12} height="20" rx="4" fill="#121A28" stroke={d.color} strokeWidth="1" />
                    <text x={pt.x + 2} y={pt.y} fill={d.color} fontSize="11" fontFamily="monospace" fontWeight="bold">
                      {d.text}
                    </text>
                  </g>
                );
              }

              return null;
            })}

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
              </g>
            )}
          </svg>

          {/* Text Annotation Prompt */}
          {textPrompt && (
            <div
              className="absolute z-30 bg-[#121A28] border border-[#00FF87] p-2 rounded-lg shadow-2xl flex items-center gap-2"
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

          {/* Minimalist Floating Clean Watermark indicator */}
          <div className="absolute bottom-3 left-4 pointer-events-none select-none z-10 flex items-center gap-2 opacity-30">
            <span className="text-[10px] font-mono tracking-widest uppercase font-bold text-slate-400">
              SAMZEN QUANTUM ENGINE
            </span>
          </div>
        </div>
      </div>
    </div>
  );
});
