import React, { useEffect, useState } from 'react';
import './displayMenu.css';
import { useDisplaySettings } from '../../../context/DisplaySettingsContext';
import useApi from '../../../utils/useApi';
import { SystemIcon, SunIcon, MoonIcon } from '../../../utils/CustomIcons';

const themeOptions = [
  { value: 'system', label: 'System', icon: SystemIcon },
  { value: 'light', label: 'Light', icon: SunIcon },
  { value: 'dark', label: 'Dark', icon: MoonIcon },
];

// Preset swatches + last = picker
const presetColors = [
  '#5387be',
                '#ff6b6b',
                '#ffd166',
                '#06d6a0',
                '#118ab2',
                '#9d4edd',
                '#e63946',
                '#f1fa8c',
                '#00b4d8',
                '#ff61a6',
                'picker'
];

const getSystemTheme = () =>
  window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
const getNextTheme = (current) => {
  const idx = themeOptions.findIndex(o => o.value===current);
  return themeOptions[(idx+1)%themeOptions.length];
};

export default function DisplayMenu({ onClose }) {
  const { settings, setSettings, apply, loaded } = useDisplaySettings();
  const { callApi } = useApi();

  const [savedSettings, setSavedSettings] = useState(null);
  const [radialCoord, setRadialCoord] = useState({ x:50, y:50 });
  const [colorCount, setColorCount] = useState(1);

  useEffect(() => {
    if (!loaded || !settings) return;
    setSavedSettings(settings);
    const len = (settings.gradientColors||[]).length||1;
    setColorCount(Math.min(4, Math.max(1, len)));
    if (settings.radialPosition?.includes('%')) {
      const [x,y] = settings.radialPosition.split(' ').map(parseFloat);
      if (!isNaN(x)&&!isNaN(y)) setRadialCoord({x,y});
    }
  }, [loaded, settings]);

  const update = (k,v) => {
    const u = {...settings, [k]:v};
    setSettings(u);
    apply(u);
  };

  const updateColor = (i,p,v) => {
    const arr = [...(settings.gradientColors||[])];
    while(arr.length<colorCount) arr.push({color:'#5387be',alpha:0.15});
    arr[i] = {...(arr[i]||{}), [p]:v};
    update('gradientColors',arr);
  };

  const handleCount = e => {
    let n = parseInt(e.target.value,10)||1;
    n = Math.min(4, Math.max(1,n));
    setColorCount(n);
    let arr = [...(settings.gradientColors||[])].slice(0,n);
    while(arr.length<n) arr.push({color:'#5387be',alpha:0.15});
    update('gradientColors',arr);
  };

  const reset = () => savedSettings && (setSettings(savedSettings), apply(savedSettings));
  const revert = () => {
    const d = {
      gradient:'radial',
      gradientColors:[{color:'#5387be',alpha:0.23}],
      fontSize:'1em',
      themeMode:'dark',
      padding:'medium',
      animations:true,
      radialPosition:'50% 50%',
      linearAngle:'135deg'
    };
    setColorCount(1);
    setSettings(d);
    apply(d);
  };
  const save = async() => {
    try {
      await callApi('settings/save/','POST',{category:'display',settings});
      setSavedSettings(settings);
      onClose();
    } catch(err){ console.error(err); }
  };

  if (!loaded||!settings) return <div className="display-settings-container">Loading…</div>;

  const {
    gradient,fontSize,padding,animations,
    radialPosition,linearAngle,themeMode='system',
    gradientColors=[]
  } = settings;

  const { label:themeLabel, icon:ThemeIcon } =
    themeOptions.find(o=>o.value===themeMode)||themeOptions[0];

  const effectiveTheme = themeMode==='system'?getSystemTheme():themeMode;
  const isLight = effectiveTheme==='light';

  return (
    <div className="display-settings-container" onClick={e=>e.stopPropagation()}>
      <div className="settings-title-row">
        <h3>Display Settings</h3>
        <button className="theme-cycle-btn"
          onClick={()=>update('themeMode',getNextTheme(themeMode).value)}
          title={`Theme: ${themeLabel}`}
        ><ThemeIcon filled/></button>
      </div>

      {!isLight && <>
        {/* Gradient Style & Color Count on same row */}
        <div className="display-setting gradient-row">
          <div className="field gradient-style-field">
            <label>Gradient Style</label>
            <select value={gradient} onChange={e=>update('gradient',e.target.value)}>
              <option value="radial">Radial</option>
              <option value="linear">Linear</option>
            </select>
          </div>
          <div className="field">
            <label>Color Count</label>
            <input type="number" min="1" max="4"
              value={colorCount} onChange={handleCount}
              className="count-input"
            />
          </div>
        </div>

        {/* Radial Pad */}
        {gradient==='radial' && (
          <div className="display-setting">
            <label>Radial Position</label>
            <div className="radial-pad" onMouseDown={e=>{
                const pad=e.currentTarget;
                const move=ev=>{
                  const r=pad.getBoundingClientRect();
                  const x=Math.min(100,Math.max(0,((ev.clientX-r.left)/r.width)*100));
                  const y=Math.min(100,Math.max(0,((ev.clientY-r.top)/r.height)*100));
                  setRadialCoord({x,y});
                  update('radialPosition',`${x.toFixed(0)}% ${y.toFixed(0)}%`);
                };
                const up=()=>{document.removeEventListener('mousemove',move);document.removeEventListener('mouseup',up);};
                document.addEventListener('mousemove',move);
                document.addEventListener('mouseup',up);
                move(e);
              }}>
              <div className="radial-indicator"
                style={{left:`${radialCoord.x}%`, top:`${radialCoord.y}%`}}
              />
            </div>
          </div>
        )}

        {/* Linear Angle */}
        {gradient==='linear' && (
          <div className="display-setting">
            <label>Linear Angle</label>
            <div className="slider-wrapper">
              <input type="range" min="0" max="360"
                value={parseInt(linearAngle)} 
                onChange={e=>update('linearAngle',`${e.target.value}deg`)}
              />
              <span className="slider-value">{parseInt(linearAngle)}°</span>
            </div>
          </div>
        )}

        {/* Gradient Colors */}
        {Array.from({length:colorCount}).map((_,i)=>(
          <div key={i} className="display-setting gradient-color-group">
            <div className="color-swatch-grid">
              {presetColors.map((c,si)=>(
                <div key={si}
                  className={`color-swatch ${c!=='picker'&&gradientColors[i]?.color===c?'active':''}`}
                  onClick={()=>{
                    if(c==='picker') document.getElementById(`picker-${i}`).click();
                    else updateColor(i,'color',c);
                  }}
                  style={{backgroundColor:c==='picker'?'transparent':c}}
                >
                  {c==='picker'&&<span className="picker-icon">🎨</span>}
                </div>
              ))}
              <input id={`picker-${i}`} type="color"
                className="color-picker-popup"
                value={gradientColors[i]?.color||'#5387be'}
                onChange={e=>updateColor(i,'color',e.target.value)}
              />
            </div>
            <div className="slider-wrapper">
              <input type="range" min="0" max="1" step="0.01"
                value={gradientColors[i]?.alpha||0.15}
                onChange={e=>updateColor(i,'alpha',parseFloat(e.target.value))}
              />
              <span className="slider-value">{(gradientColors[i]?.alpha||0.15).toFixed(2)}</span>
            </div>
          </div>
        ))}
      </>}

      {/* Font Size */}
      <div className="display-setting">
        <label>Font Size</label>
        <div className="slider-wrapper">
          <input type="range" min="0.8" max="1.5" step="0.1"
            value={parseFloat(fontSize)}
            onChange={e=>update('fontSize',`${e.target.value}em`)}
          />
          <span className="slider-value">{parseFloat(fontSize).toFixed(1)}em</span>
        </div>
      </div>

      {/* Padding */}
      <div className="display-setting">
        <label>Padding</label>
        <select value={padding} onChange={e=>update('padding',e.target.value)}>
          <option value="small">Small</option>
          <option value="medium">Medium</option>
          <option value="large">Large</option>
        </select>
      </div>

      {/* Animations Toggle */}
      <div className="display-setting toggle-group">
        <label>Enable Animations</label>
        <label className="display-toggle">
          <input type="checkbox" checked={animations}
            onChange={()=>update('animations',!animations)} />
          <span className="display-toggle-slider"></span>
        </label>
      </div>

      {/* Reset/Revert (half width each) & Save */}
      <div className="button-row">
        <div className="inline-buttons">
          <button onClick={reset}>Reset</button>
          <button onClick={revert}>Revert to Default</button>
        </div>
        <button className="save-button" onClick={save}>Save</button>
      </div>
    </div>
  );
}
