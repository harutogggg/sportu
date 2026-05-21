'use client'
import { useEffect, useState } from 'react'
import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
)

export default function Home() {
  const [events, setEvents] = useState<any[]>([])
  const [joined, setJoined] = useState<Set<string>>(new Set())
  const [view, setView] = useState('home')
  const [filter, setFilter] = useState('全て')
  const [showModal, setShowModal] = useState(false)
  const [newTitle, setNewTitle] = useState('')
  const [newSport, setNewSport] = useState('サッカー')
  const [newDate, setNewDate] = useState('')
  const [newLocation, setNewLocation] = useState('')
  const [newSpots] = useState(8)
  const [newLevel] = useState('初心者歓迎')
  const [toast, setToast] = useState('')

  useEffect(() => { fetchEvents() }, [])

  async function fetchEvents() {
    const { data } = await supabase.from('events').select('*').order('created_at', { ascending: false })
    if (data) setEvents(data)
  }

  function showToast(msg: string) {
    setToast(msg)
    setTimeout(() => setToast(''), 2500)
  }

  async function toggleJoin(id: string) {
    const ev = events.find(e => e.id === id)
    if (!ev) return
    if (joined.has(id)) {
      await supabase.from('events').update({ joined: ev.joined - 1 }).eq('id', id)
      setJoined(prev => { const s = new Set(prev); s.delete(id); return s })
      showToast('参加をキャンセルしました')
    } else {
      if (ev.joined >= ev.spots) { showToast('満員です！'); return }
      await supabase.from('events').update({ joined: ev.joined + 1 }).eq('id', id)
      setJoined(prev => new Set(prev).add(id))
      showToast('参加しました！🎉')
    }
    fetchEvents()
  }

  async function createEvent() {
    if (!newTitle || !newDate || !newLocation) { showToast('タイトル・日時・場所は必須です'); return }
    await supabase.from('events').insert({
      title: newTitle, sport: newSport, date: newDate,
      location: newLocation, spots: newSpots, level: newLevel,
      organizer: '田中 悠人', joined: 0
    })
    setShowModal(false)
    setNewTitle(''); setNewDate(''); setNewLocation('')
    showToast('募集を投稿しました！')
    fetchEvents()
  }

  const filtered = filter === '全て' ? events : events.filter(e => e.sport === filter)
  const sports = ['全て','サッカー','バスケ','テニス','バドミントン','バレー']

  return (
    <main style={{maxWidth:480,margin:'0 auto',fontFamily:'sans-serif',background:'#f5f5f5',minHeight:'100vh',paddingBottom:80}}>
      <div style={{background:'#1A1A2E',color:'white',padding:'14px 20px',display:'flex',justifyContent:'space-between',alignItems:'center',position:'sticky',top:0,zIndex:100}}>
        <div style={{fontSize:20,fontWeight:800}}>Sport<span style={{color:'#FF5A1F'}}>U</span></div>
      </div>
      <div style={{display:'flex',background:'white',borderBottom:'1px solid #eee',padding:'0 8px'}}>
        {['home','chat','profile'].map(v => (
          <button key={v} onClick={() => setView(v)} style={{flex:1,padding:'12px 4px',border:'none',background:'none',borderBottom:view===v?'2px solid #FF5A1F':'2px solid transparent',color:view===v?'#FF5A1F':'#888',cursor:'pointer',fontSize:13}}>
            {v==='home'?'募集一覧':v==='chat'?'チャット':'プロフィール'}
          </button>
        ))}
      </div>
      {view==='home' && (
        <div style={{padding:16}}>
          <div style={{fontWeight:700,fontSize:18,marginBottom:12}}>近くの募集</div>
          <div style={{display:'flex',gap:8,marginBottom:14,overflowX:'auto'}}>
            {sports.map(s => (
              <button key={s} onClick={() => setFilter(s)} style={{background:filter===s?'#1A1A2E':'#eee',color:filter===s?'white':'#666',border:'none',borderRadius:20,padding:'6px 14px',fontSize:13,cursor:'pointer',whiteSpace:'nowrap'}}>
                {s}
              </button>
            ))}
          </div>
          {filtered.map(ev => (
            <div key={ev.id} style={{background:'white',borderRadius:12,padding:16,marginBottom:12,border:'1px solid #eee'}}>
              <div style={{display:'flex',justifyContent:'space-between',marginBottom:8}}>
                <span style={{background:'#FFF0EB',color:'#FF5A1F',borderRadius:6,padding:'3px 10px',fontSize:12}}>{ev.sport}</span>
                <span style={{background:'#f5f5f5',borderRadius:20,padding:'3px 10px',fontSize:12,color:'#666'}}>残り{ev.spots-ev.joined}名</span>
              </div>
              <div style={{fontWeight:700,fontSize:15,marginBottom:8}}>{ev.title}</div>
              <div style={{fontSize:13,color:'#888',marginBottom:12}}>📅 {ev.date} 📍 {ev.location}</div>
              <div style={{display:'flex',justifyContent:'space-between',alignItems:'center'}}>
                <span style={{fontSize:13,color:'#888'}}>主催: {ev.organizer}</span>
                <button onClick={() => toggleJoin(ev.id)} style={{background:joined.has(ev.id)?'#E0FBF4':'#FF5A1F',color:joined.has(ev.id)?'#00C896':'white',border:'none',borderRadius:8,padding:'7px 16px',fontSize:13,cursor:'pointer'}}>
                  {joined.has(ev.id)?'参加済み':'参加する'}
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
      {view==='chat' && (
        <div style={{padding:16}}>
          <div style={{fontWeight:700,fontSize:18,marginBottom:12}}>チャット</div>
          {joined.size===0 ? (
            <div style={{textAlign:'center',padding:40,color:'#aaa'}}>募集に参加するとチャットが始まります</div>
          ) : (
            events.filter(e => joined.has(e.id)).map(ev => (
              <div key={ev.id} style={{background:'white',borderRadius:12,padding:16,marginBottom:10,border:'1px solid #eee',display:'flex',alignItems:'center',gap:12}}>
                <div style={{width:44,height:44,borderRadius:'50%',background:'#FFF0EB',display:'flex',alignItems:'center',justifyContent:'center',color:'#FF5A1F',fontWeight:700}}>{ev.organizer[0]}</div>
                <div>
                  <div style={{fontWeight:500,fontSize:14}}>{ev.title}</div>
                  <div style={{fontSize:12,color:'#aaa'}}>タップしてチャットを開く</div>
                </div>
              </div>
            ))
          )}
        </div>
      )}
      {view==='profile' && (
        <div style={{padding:16}}>
          <div style={{background:'#1A1A2E',borderRadius:12,padding:24,color:'white',textAlign:'center',marginBottom:16}}>
            <div style={{width:64,height:64,borderRadius:'50%',background:'#FF5A1F',margin:'0 auto 12px',display:'flex',alignItems:'center',justifyContent:'center',fontSize:22,fontWeight:700}}>田</div>
            <div style={{fontSize:20,fontWeight:700}}>田中 悠人</div>
            <div style={{fontSize:13,opacity:0.6}}>東京大学 3年生</div>
          </div>
          <div style={{display:'grid',gridTemplateColumns:'repeat(3,1fr)',gap:10,marginBottom:16}}>
            {([['参加中',joined.size],['参加済み',12],['主催',5]] as [string,number][]).map(([label,num]) => (
              <div key={label} style={{background:'white',borderRadius:10,padding:14,textAlign:'center',border:'1px solid #eee'}}>
                <div style={{fontSize:24,fontWeight:700,color:'#FF5A1F'}}>{num}</div>
                <div style={{fontSize:12,color:'#888'}}>{label}</div>
              </div>
            ))}
          </div>
        </div>
      )}
      <button onClick={() => setShowModal(true)} style={{position:'fixed',bottom:88,right:16,background:'#FF5A1F',color:'white',border:'none',borderRadius:'50%',width:52,height:52,fontSize:28,cursor:'pointer',zIndex:50}}>+</button>
      {showModal && (
        <div style={{position:'fixed',inset:0,background:'rgba(0,0,0,0.5)',zIndex:200,display:'flex',alignItems:'flex-end'}} onClick={() => setShowModal(false)}>
          <div style={{background:'white',borderRadius:'20px 20px 0 0',padding:24,width:'100%',maxHeight:'80vh',overflowY:'auto'}} onClick={e => e.stopPropagation()}>
            <div style={{fontWeight:700,fontSize:20,marginBottom:16}}>募集を作成</div>
            <div style={{marginBottom:12}}>
              <label style={{fontSize:13,color:'#888',display:'block',marginBottom:4}}>タイトル</label>
              <input value={newTitle} onChange={e=>setNewTitle(e.target.value)} placeholder="例: 渋谷で5vs5サッカー！" style={{width:'100%',padding:'10px 12px',border:'1px solid #eee',borderRadius:8,fontSize:14,boxSizing:'border-box'}} />
            </div>
            <div style={{marginBottom:12}}>
              <label style={{fontSize:13,color:'#888',display:'block',marginBottom:4}}>場所</label>
              <input value={newLocation} onChange={e=>setNewLocation(e.target.value)} placeholder="例: 代々木公園" style={{width:'100%',padding:'10px 12px',border:'1px solid #eee',borderRadius:8,fontSize:14,boxSizing:'border-box'}} />
            </div>
            <div style={{marginBottom:12}}>
              <label style={{fontSize:13,color:'#888',display:'block',marginBottom:4}}>日時</label>
              <input type="datetime-local" value={newDate} onChange={e=>setNewDate(e.target.value)} style={{width:'100%',padding:'10px 12px',border:'1px solid #eee',borderRadius:8,fontSize:14,boxSizing:'border-box'}} />
            </div>
            <div style={{marginBottom:12}}>
              <label style={{fontSize:13,color:'#888',display:'block',marginBottom:4}}>スポーツ</label>
              <select value={newSport} onChange={e=>setNewSport(e.target.value)} style={{width:'100%',padding:'10px 12px',border:'1px solid #eee',borderRadius:8,fontSize:14,boxSizing:'border-box'}}>
                {['サッカー','バスケ','テニス','バドミントン','バレー','野球','その他'].map(s=><option key={s}>{s}</option>)}
              </select>
            </div>
            <button onClick={createEvent} style={{width:'100%',background:'#1A1A2E',color:'white',border:'none',borderRadius:10,padding:14,fontSize:15,cursor:'pointer',marginTop:8}}>募集を投稿する</button>
          </div>
        </div>
      )}
      {toast && (
        <div style={{position:'fixed',bottom:100,left:'50%',transform:'translateX(-50%)',background:'#1A1A2E',color:'white',borderRadius:10,padding:'10px 20px',fontSize:14,zIndex:300,whiteSpace:'nowrap'}}>{toast}</div>
      )}
      <div style={{position:'fixed',bottom:0,left:'50%',transform:'translateX(-50%)',width:'100%',maxWidth:480,background:'white',borderTop:'1px solid #eee',display:'flex',zIndex:100}}>
        {['home','chat','profile'].map(v=>(
          <button key={v} onClick={()=>setView(v)} style={{flex:1,padding:'10px 4px 12px',border:'none',background:'none',color:view===v?'#FF5A1F':'#aaa',cursor:'pointer',fontSize:11}}>
            {v==='home'?'🏠 ホーム':v==='chat'?'💬 チャット':'👤 プロフィール'}
          </button>
        ))}
      </div>
    </main>
  )
}