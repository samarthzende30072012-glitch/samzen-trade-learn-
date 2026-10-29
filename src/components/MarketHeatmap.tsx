import React, { useEffect, useRef, useState } from 'react';
import { TradingAsset } from '../types';
import * as d3 from 'd3';
import { TrendingUp, TrendingDown, RefreshCw, BarChart2, Search } from 'lucide-react';

interface MarketHeatmapProps {
  assets: TradingAsset[];
  onSelectAsset: (asset: TradingAsset) => void;
  theme?: 'dark' | 'light';
}

export default function MarketHeatmap({ assets, onSelectAsset, theme = 'dark' }: MarketHeatmapProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [filterType, setFilterType] = useState<'ALL' | 'stock' | 'crypto' | 'forex'>('ALL');
  const [hoveredAsset, setHoveredAsset] = useState<TradingAsset | null>(null);
  const [tooltipPos, setTooltipPos] = useState({ x: 0, y: 0 });
  const isLight = theme === 'light';

  useEffect(() => {
    if (!containerRef.current) return;

    // Clear previous SVG
    d3.select(containerRef.current).selectAll('*').remove();

    const width = containerRef.current.clientWidth || 900;
    const height = 520;

    const filteredAssets = filterType === 'ALL' 
      ? assets 
      : assets.filter(a => a.type === filterType);

    if (filteredAssets.length === 0) return;

    // Group assets by sector
    const sectorsMap = new Map<string, TradingAsset[]>();
    filteredAssets.forEach(a => {
      const sec = a.sector || 'General';
      if (!sectorsMap.has(sec)) sectorsMap.set(sec, []);
      sectorsMap.get(sec)!.push(a);
    });

    const rootData = {
      name: 'Market',
      children: Array.from(sectorsMap.entries()).map(([sectorName, items]) => ({
        name: sectorName,
        children: items.map(item => ({
          name: item.symbol,
          asset: item,
          value: Math.max(20, Math.abs(item.price * (item.change || 0.5) * 10))
        }))
      }))
    };

    const root = d3.hierarchy(rootData)
      .sum((d: any) => d.value || 1)
      .sort((a, b) => (b.value || 0) - (a.value || 0));

    const treemap = d3.treemap<any>()
      .size([width, height])
      .paddingTop(24)
      .paddingRight(3)
      .paddingBottom(3)
      .paddingLeft(3)
      .round(true);

    treemap(root);

    const svg = d3.select(containerRef.current)
      .append('svg')
      .attr('width', '100%')
      .attr('height', height)
      .attr('viewBox', `0 0 ${width} ${height}`)
      .style('font-family', 'ui-monospace, monospace');

    // Color scale for 24h change: deep red (-5%) to neutral (0%) to deep green (+5%)
    const colorScale = d3.scaleLinear<string>()
      .domain([-4, 0, 4])
      .range(['#EF4444', isLight ? '#E2E8F0' : '#1E293B', '#10B981'])
      .clamp(true);

    // Render group nodes
    const leaf = svg.selectAll('g')
      .data(root.leaves())
      .enter()
      .append('g')
      .attr('transform', (d: any) => `translate(${d.x0},${d.y0})`)
      .style('cursor', 'pointer')
      .on('click', (event, d: any) => {
        if (d.data.asset) {
          onSelectAsset(d.data.asset);
        }
      })
      .on('mousemove', (event, d: any) => {
        if (d.data.asset) {
          setHoveredAsset(d.data.asset);
          const rect = containerRef.current?.getBoundingClientRect();
          if (rect) {
            setTooltipPos({
              x: event.clientX - rect.left,
              y: event.clientY - rect.top - 60
            });
          }
        }
      })
      .on('mouseleave', () => {
        setHoveredAsset(null);
      });

    // Rectangles
    leaf.append('rect')
      .attr('id', (d: any) => d.data.name)
      .attr('width', (d: any) => Math.max(0, d.x1 - d.x0 - 1))
      .attr('height', (d: any) => Math.max(0, d.y1 - d.y0 - 1))
      .attr('rx', 4)
      .attr('ry', 4)
      .attr('fill', (d: any) => {
        const asset = d.data.asset as TradingAsset;
        return colorScale(asset ? asset.change : 0);
      })
      .attr('stroke', isLight ? '#CBD5E1' : '#070B14')
      .attr('stroke-width', 1.5)
      .style('transition', 'filter 0.2s')
      .on('mouseenter', function() {
        d3.select(this).attr('filter', 'brightness(1.2)');
      })
      .on('mouseleave', function() {
        d3.select(this).attr('filter', null);
      });

    // Asset Symbol text
    leaf.append('text')
      .attr('x', 6)
      .attr('y', 18)
      .text((d: any) => {
        const asset = d.data.asset as TradingAsset;
        return asset ? asset.symbol : '';
      })
      .attr('font-size', (d: any) => (d.x1 - d.x0 > 60 && d.y1 - d.y0 > 45) ? '12px' : '9px')
      .attr('font-weight', 'bold')
      .attr('fill', (d: any) => {
        const asset = d.data.asset as TradingAsset;
        if (!asset) return '#fff';
        return Math.abs(asset.change) > 1.5 ? '#ffffff' : (isLight ? '#0F172A' : '#F8FAFC');
      })
      .style('pointer-events', 'none');

    // Asset Change % text
    leaf.append('text')
      .attr('x', 6)
      .attr('y', 34)
      .text((d: any) => {
        const asset = d.data.asset as TradingAsset;
        if (!asset) return '';
        return `${asset.change >= 0 ? '+' : ''}${asset.change}%`;
      })
      .attr('font-size', '10px')
      .attr('font-weight', '700')
      .attr('fill', (d: any) => {
        const asset = d.data.asset as TradingAsset;
        if (!asset) return '#fff';
        return Math.abs(asset.change) > 1.5 ? '#ffffff' : (isLight ? '#334155' : '#94A3B8');
      })
      .style('pointer-events', 'none');

    // Sector Headers (parents)
    const parents = svg.selectAll('.parent')
      .data(root.descendants().filter((d: any) => d.depth === 1))
      .enter()
      .append('g')
      .attr('transform', (d: any) => `translate(${d.x0},${d.y0})`);

    parents.append('text')
      .attr('x', 6)
      .attr('y', 15)
      .text((d: any) => d.data.name)
      .attr('font-size', '10px')
      .attr('font-weight', 'bold')
      .attr('fill', isLight ? '#475569' : '#94A3B8')
      .style('text-transform', 'uppercase')
      .style('letter-spacing', '0.05em')
      .style('pointer-events', 'none');

  }, [assets, filterType, isLight]);

  return (
    <div className={`rounded-2xl border p-5 shadow-2xl space-y-4 ${
      isLight ? 'bg-white border-slate-200 text-slate-800' : 'bg-[#0A0E17] border-white/10 text-white'
    }`}>
      {/* Header & Filter Controls */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h3 className="text-base font-serif font-black flex items-center gap-2">
            <BarChart2 className="w-5 h-5 text-[#00FF87]" />
            <span>Real-Time Market Heatmap</span>
          </h3>
          <p className="text-xs font-mono opacity-70">
            D3.js Treemap visualization of global equities, forex & crypto sectors
          </p>
        </div>

        <div className="flex items-center gap-2 font-mono text-xs">
          {(['ALL', 'stock', 'crypto', 'forex'] as const).map(type => (
            <button
              key={type}
              onClick={() => setFilterType(type)}
              className={`px-3 py-1.5 rounded-xl border font-bold uppercase transition cursor-pointer ${
                filterType === type
                  ? isLight
                    ? 'bg-emerald-600 text-white border-emerald-600'
                    : 'bg-[#00FF87] text-[#0A0E17] border-[#00FF87]'
                  : isLight
                  ? 'bg-slate-100 text-slate-700 border-slate-200 hover:bg-slate-200'
                  : 'bg-[#121A28] text-slate-300 border-white/10 hover:bg-[#1E293B]'
              }`}
            >
              {type === 'ALL' ? 'All Markets' : type === 'stock' ? 'Equities' : type === 'crypto' ? 'Crypto' : 'Forex'}
            </button>
          ))}
        </div>
      </div>

      {/* Heatmap Container */}
      <div className="relative w-full overflow-hidden rounded-xl border border-white/10 bg-[#070B12]" ref={containerRef}>
        {/* Floating Tooltip */}
        {hoveredAsset && (
          <div 
            className="absolute z-50 pointer-events-none px-3 py-2 rounded-xl bg-slate-900/95 border border-white/20 shadow-2xl text-white font-mono text-xs space-y-1 transform -translate-x-1/2"
            style={{ left: tooltipPos.x, top: tooltipPos.y }}
          >
            <div className="flex items-center justify-between gap-3">
              <span className="font-bold text-sm text-[#00FF87]">{hoveredAsset.symbol}</span>
              <span className={`font-bold ${hoveredAsset.change >= 0 ? 'text-emerald-400' : 'text-rose-400'}`}>
                {hoveredAsset.change >= 0 ? '+' : ''}{hoveredAsset.change}%
              </span>
            </div>
            <div className="text-[11px] text-slate-300 truncate max-w-[200px]">{hoveredAsset.name}</div>
            <div className="flex justify-between text-[10px] text-slate-400 pt-1 border-t border-white/10">
              <span>Price: ₹{hoveredAsset.price.toLocaleString()}</span>
              <span>Sector: {hoveredAsset.sector || 'General'}</span>
            </div>
          </div>
        )}
      </div>

      <div className="flex items-center justify-between text-[11px] font-mono opacity-60 px-1">
        <span>💡 Click any asset cell to open live chart & trading terminal</span>
        <div className="flex items-center gap-3">
          <span className="flex items-center gap-1"><span className="w-2.5 h-2.5 rounded-sm bg-rose-500 inline-block" /> Bearish</span>
          <span className="flex items-center gap-1"><span className="w-2.5 h-2.5 rounded-sm bg-slate-600 inline-block" /> Neutral</span>
          <span className="flex items-center gap-1"><span className="w-2.5 h-2.5 rounded-sm bg-emerald-500 inline-block" /> Bullish</span>
        </div>
      </div>
    </div>
  );
}
