import React from 'react';

type SettingsTabProps = {
  goTab: (tab: string) => void;
  supabase: any;
  hasSupabaseConfig: boolean;
  pushToast: (msg: string) => void;
  profile: any;
  setProfile: React.Dispatch<React.SetStateAction<any>>;
  unsaved: boolean;
  setUnsaved: React.Dispatch<React.SetStateAction<boolean>>;
  avatarFileRef: React.RefObject<HTMLInputElement>;
  handleAvatarFileChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  coverFileRef: React.RefObject<HTMLInputElement>;
  handleCoverFileChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  saveProfileNow: () => Promise<void> | void;
  savingProfile: boolean;
  setSaveToast: (msg: string) => void;
};

export function SettingsTab({
  goTab,
  supabase,
  hasSupabaseConfig,
  pushToast,
  profile,
  setProfile,
  unsaved,
  setUnsaved,
  avatarFileRef,
  handleAvatarFileChange,
  coverFileRef,
  handleCoverFileChange,
  saveProfileNow,
  savingProfile,
  setSaveToast,
}: SettingsTabProps) {
  return (
     <div style={{ border:'1px solid #333', borderRadius:12, padding:12, background:'#171717', maxWidth:980, margin:'0 auto' }}>
    <h3 style={{ marginTop:0, marginBottom:8 }}>Settings</h3>
    <div style={{ display:'flex', justifyContent:'flex-end', marginBottom:8 }}>
      <button
        type="button"
        className="clear-btn"
        onClick={()=>goTab('profile')}
        title="Back to profile"
        aria-label="Back to profile"
      >
        ← Back to profile
      </button>
    </div>

          {/* OWNER-ONLY: Account & Settings */}
      <div className="episode-card" style={{ marginTop:18 }}>
        <h3 style={{ margin:0 }}>Account &amp; Settings (only you)</h3>
        <p className="review-meta" style={{ marginTop:6 }}>
          Changes are local until you press “Save profile”.
        </p>

          {/* Account */}
          <div className="episode-card" style={{ marginTop:8 }}>
            <h4 style={{ margin:'0 0 8px' }}>Account</h4>
            <div style={{ display:'flex', gap:8, flexWrap:'wrap' }}>
              <button
                type="button"
                className="clear-btn"
                onClick={async ()=>{
                  if (!hasSupabaseConfig) return pushToast('Connect Supabase first.');
                  const { data } = await supabase.auth.getUser();
                  const cur = data?.user?.email || '';
                  const next = prompt('New email address', cur);
                  if (!next || next.trim() === cur) return;
                  const { error } = await supabase.auth.updateUser({ email: next.trim() });
                  if (error) pushToast('Could not complete that action.');
                  else pushToast('Email update requested. Check your inbox to confirm the change.');
                }}
              >
                Change email
              </button>

              <button
                type="button"
                className="clear-btn"
                onClick={async ()=>{
                  if (!hasSupabaseConfig) return pushToast('Connect Supabase first.');
                  const p1 = prompt('New password (min 6 chars)') || '';
                  if (p1.length < 6) return pushToast('Password too short.');
                  const p2 = prompt('Confirm new password') || '';
                  if (p1 !== p2) return pushToast('Passwords do not match.');
                  const { error } = await supabase.auth.updateUser({ password: p1 });
                  if (error) pushToast('Could not complete that action.');
                  else pushToast('Password updated.');
                }}
              >
                Change password
              </button>

              <button
                type="button"
                className="clear-btn"
                onClick={async ()=>{ await supabase.auth.signOut(); pushToast('Logged out'); }}
              >
                Log out
              </button>
            </div>
          </div>
        </div>
     {/* Profile fields */}
        <div style={{ display:'grid', gap:8, marginTop:10 }}>
          <label style={{ display:'grid', gap:6 }}>
            <span>Display name</span>
            <input
              className="input"
              value={profile.name}
              onChange={(e)=>{ setProfile(p=>({ ...p, name: e.target.value })); setUnsaved(true); }}
              placeholder="Your name"
            />
          </label>

          <label style={{ display:'grid', gap:6 }}>
            <span>Handle (no @, must be unique)</span>
            <input
  className="input"
  value={profile.handle ?? ''}
  placeholder="e.g. vprfan"
  inputMode="latin"
  maxLength={20}                       // keep in sync with DB
  
  onChange={(e) => {
    const raw = e.target.value;
    const cleaned = raw
      .replace(/^@/, '')
      .toLowerCase()
      .replace(/[^a-z0-9_]/g, '');
    setProfile(p => ({ ...p, handle: cleaned }));
   setUnsaved(true);
  }}
 onBlur={(e) => {
   const h = e.target.value.trim();
   if (h && h.length < 3) pushToast('Handle must be at least 3 characters.');
 }}

/>
          </label>

          <label style={{ display:'grid', gap:6 }}>
            <span>Bio</span>
            <textarea
              className="input"
              rows={3}
              value={profile.bio || ''}
              onChange={(e)=>{ setProfile(p=>({ ...p, bio: e.target.value })); setUnsaved(true); }}
              placeholder="A few words about you…"
            />
          </label>

          {/* Avatar controls (single canonical input) */}
          <div style={{ display:'flex', gap:8, alignItems:'center', flexWrap:'wrap' }}>
            <input
              ref={avatarFileRef}
              type="file"
              accept="image/*"
              onChange={handleAvatarFileChange}
              style={{ display:'none' }}
            />
            <button
              type="button"
              className="clear-btn"
              onClick={()=>avatarFileRef.current?.click()}
            >
              Upload avatar
            </button>
            {profile.avatar && (
              <button
                type="button"
                className="clear-btn"
                onClick={()=>setProfile(p=>({ ...p, avatar:'' }))}
              >
                Remove avatar
              </button>
            )}
          </div>
            <span className="review-meta">1:1 crop opens after you pick an image.</span>
          </div>

          {/* Cover controls (single canonical input) */}
          <div style={{ display:'flex', gap:8, alignItems:'center', flexWrap:'wrap' }}>
            <input
              ref={coverFileRef}
              type="file"
              accept="image/*"
              onChange={handleCoverFileChange}
              style={{ display:'none' }}
            />
            <button
              type="button"
              className="clear-btn"
              onClick={()=>coverFileRef.current?.click()}
            >
              Upload cover
            </button>
            {profile.cover_url && (
              <button
                type="button"
                className="clear-btn"
                onClick={()=>setProfile(p=>({ ...p, cover_url:'' }))}
              >
                Remove cover
              </button>
            )}
            <span className="review-meta">Wide crop (3:1) opens after you pick an image.</span>
          </div>

          {/* Privacy */}
          {false && (      
          <label style={{ display:'flex', gap:8, alignItems:'center' }}
            >
            <input
              type="checkbox"
              checked={!!profile.isPublic}
              onChange={(e)=>setProfile(p=>({ ...p, isPublic: e.target.checked }))}
            />
            <span>Make my profile public</span>
          </label>
)}

          <div style={{ marginTop:8, display:'flex', gap:8, alignItems:'center' }}>

<button
  type="button"
  className="clear-btn"
  disabled={savingProfile || !unsaved}
  onClick={async () => {
   try { setSavingProfile(true); await saveProfileNow(); setUnsaved(false); setSaveToast('Saved!'); }
   finally { setSavingProfile(false); }
   setTimeout(()=>setSaveToast(''), 1500);
  }}
>
  {savingProfile ? 'Saving…' : 'Save profile'}
</button>

  <span className="review-meta">Saves name, handle, bio, avatar & cover to Supabase.</span>
</div>
  </div>
  );
}
