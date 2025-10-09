import React, { useEffect, useState } from 'react';

export default function ThemePicker() {
  const [primary, setPrimary] = useState('#6331c9');
  const [secondary, setSecondary] = useState('#D2D6EF');
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    let mounted = true;
    window.electron.getTheme().then((theme) => {
      if (!mounted || !theme) return;
      if (theme.primary) setPrimary(theme.primary);
      if (theme.secondary) setSecondary(theme.secondary);
      // apply immediately to preview
      document.documentElement.style.setProperty('--color-primary', theme.primary || '#6331c9');
      document.documentElement.style.setProperty('--color-secondary', theme.secondary || '#D2D6EF');
    });
    return () => { mounted = false; };
  }, []);

  const applyLocal = (p, s) => {
    document.documentElement.style.setProperty('--color-primary', p);
    document.documentElement.style.setProperty('--color-secondary', s);
  };

  const saveTheme = async () => {
    setSaving(true);
    try {
      await window.electron.setTheme({ primary, secondary });
    } finally {
      setSaving(false);
    }
  };

  const setClassicLight = () => {
    const p = '#6331c9';
    const s = '#D2D6EF';
    setPrimary(p);
    setSecondary(s);
    applyLocal(p, s);
  };

  const setClassicDark = () => {
    const p = '#D2D6EF';
    const s = '#181825';
    setPrimary(p);
    setSecondary(s);
    applyLocal(p, s);
  };

  return (
    <div className="w-full max-w-[28rem] p-4 rounded-xl border border-secondary bg-secondary/40">
       <div className='w-full flex justify-center items-center flex-col mb-10'>
         <h2 className='text-2xl font-semibold text-primary'>Pick your own theme</h2>
        <p className='text-sm text-primary text-center'>Choose a primary color and an accent color for a full customised experience</p>
       </div>
       
      <div className="flex items-center justify-between mb-4">
        <label className="text-primary font-medium">Primary</label>
        <input
          type="color"
          value={primary}
          onChange={(e) => { setPrimary(e.target.value); applyLocal(e.target.value, secondary); }}
          className="w-10 h-10 rounded-md cursor-pointer bg-transparent"
          title="Select primary color"
        />
      </div>

      <div className="flex items-center justify-between mb-4">
        <label className="text-primary font-medium">Accent</label>
        <input
          type="color"
          value={secondary}
          onChange={(e) => { setSecondary(e.target.value); applyLocal(primary, e.target.value); }}
          className="w-10 h-10 rounded-md cursor-pointer bg-transparent"
          title="Select secondary color"
        />
      </div>
        <h2 className='text-xl font-semibold text-primary text-center w-full]'>Or choose one of the following presets!</h2>
      <div className="flex items-center gap-3 mb-4 justify-center mt-5">
        <button
          type="button"
          onClick={setClassicLight}
          className="cursor-pointer px-3 py-2 rounded-lg bg-primary text-secondary font-semibold hover:opacity-90 transition-all"
        >
          Classic Light
        </button>
        <button
          type="button"
          onClick={setClassicDark}
          className="cursor-pointer px-3 py-2 rounded-lg border border-primary text-primary font-semibold hover:bg-primary/10 transition-all"
        >
          Classic Dark
        </button>
      </div>

      <div className="flex justify-end mt-10">
        <button
          type="button"
          onClick={saveTheme}
          disabled={saving}
          className="cursor-pointer w-40 h-10 rounded-3xl bg-primary text-secondary font-semibold hover:w-50 transition-all duration-300 disabled:opacity-50"
        >
            Save Theme
        </button>
      </div>
    </div>
  );
}
