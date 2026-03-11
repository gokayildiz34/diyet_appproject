import { useState, useEffect } from "react";

const INITIAL_POSTS = [
  {
    id: "bot-1",
    user: "Zeynep",
    avatar: "https://i.pravatar.cc/150?u=zeynep",
    content: "Diyette 3. günüm ama bugün canım inanılmaz tatlı istiyor, zor dayanıyorum... 🍩",
    image: null,
    calories: null,
    aiComment: null,
    likes: 12,
    comments: [{ user: "Mert", text: "Dayan Zeynep, az kaldı!" }],
    isBot: true,
  }
];

function FeedPage() {
  const [text, setText] = useState("");
  const [image, setImage] = useState(null);
  const [posts, setPosts] = useState(INITIAL_POSTS);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [notification, setNotification] = useState(null); // Bildirim state'i

  // Beğeni Fonksiyonu
  const handleLike = (id) => {
    setPosts((prev) =>
      prev.map((p) => (p.id === id ? { ...p, likes: p.likes + 1 } : p))
    );
  };

  // Yorum Ekleme Fonksiyonu
  const handleAddComment = (id, commentText) => {
    if (!commentText.trim()) return;
    setPosts((prev) =>
      prev.map((p) =>
        p.id === id
          ? { ...p, comments: [...p.comments, { user: "Hatice", text: commentText }] }
          : p
      )
    );
  };

  const addPost = () => {
    if (text === "" && !image) return;
    setIsAnalyzing(true);

    setTimeout(() => {
      const newId = Date.now();
      const newPost = {
        id: newId,
        user: "Hatice (Sen)",
        avatar: "https://api.dicebear.com/7.x/avataaars/svg?seed=Hatice",
        content: text,
        image: image,
        calories: "🔥 650 Kalori | 75g Karbonhidrat",
        aiComment: null,
        likes: 0,
        comments: [],
      };

      setPosts((prev) => [newPost, ...prev]);
      setText("");
      setImage(null);
      setIsAnalyzing(false);

      // --- SİMÜLASYON ZİNCİRİ ---

      // 1. Koç Demir Yorumu (2.5 sn sonra)
      setTimeout(() => {
        setPosts((curr) =>
          curr.map((p) =>
            p.id === newId
              ? { ...p, aiComment: "Sert Koç Demir: O kruvasan kaçamak değil, bir suç mahalli! Yarın sabah aç karnına 45 dk yürüyüş. 😤" }
              : p
          )
        );
      }, 2500);

      // 2. Bot Can'ın Beğenisi ve Bildirimi (5 sn sonra)
      setTimeout(() => {
        setNotification("Bot Can postunu beğendi! ❤️");
        handleLike(newId);
        
        // Bildirimi 3 saniye sonra ekrandan kaldır
        setTimeout(() => setNotification(null), 3000);
      }, 5000);

    }, 1500);
  };

  const handleImage = (e) => {
    const file = e.target.files[0];
    if (file) setImage(URL.createObjectURL(file));
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 font-sans pb-20 relative overflow-x-hidden">
      
      {/* CANLI BİLDİRİM (TOAST) */}
      {notification && (
        <div className="fixed top-20 right-4 z-[100] bg-purple-600 text-white px-6 py-3 rounded-2xl shadow-2xl animate-bounce border border-purple-400">
           {notification}
        </div>
      )}

      <header className="sticky top-0 z-50 bg-slate-950/80 backdrop-blur-md border-b border-slate-800 p-4">
        <h1 className="text-2xl font-black tracking-tighter bg-gradient-to-r from-purple-400 to-pink-600 bg-clip-text text-transparent text-center">
          GHOSTPLATE
        </h1>
      </header>

      <main className="max-w-lg mx-auto p-4">
        {/* Post Giriş Alanı */}
        <div className="bg-slate-900 rounded-2xl p-4 border border-slate-800 shadow-xl mb-8">
          <textarea
            className="w-full bg-transparent border-none focus:ring-0 text-lg placeholder-slate-500 resize-none"
            placeholder="Bugün ne gömdün?"
            rows="2"
            value={text}
            onChange={(e) => setText(e.target.value)}
          />
          {image && (
            <div className="relative mb-3">
              <img src={image} className="rounded-xl w-full h-48 object-cover" alt="Preview" />
              <button onClick={() => setImage(null)} className="absolute top-2 right-2 bg-black/50 p-1 rounded-full">✕</button>
            </div>
          )}
          <div className="flex justify-between items-center border-t border-slate-800 pt-3">
            <label className="cursor-pointer hover:bg-slate-800 p-2 rounded-full transition">
              <span>📷</span>
              <input type="file" className="hidden" onChange={handleImage} />
            </label>
            <button
              onClick={addPost}
              className="px-6 py-2 rounded-full font-bold bg-purple-600 hover:bg-purple-500 transition disabled:opacity-50"
              disabled={isAnalyzing}
            >
              {isAnalyzing ? "Analiz..." : "Paylaş"}
            </button>
          </div>
        </div>

        {/* Akış (Feed) */}
        <div className="space-y-6">
          {posts.map((post) => (
            <div key={post.id} className="bg-slate-900 rounded-3xl border border-slate-800">
              <div className="flex items-center p-4 gap-3">
                <img src={post.avatar} className="w-10 h-10 rounded-full border-2 border-purple-500/20" alt="avatar" />
                <h4 className="font-bold text-sm">{post.user}</h4>
              </div>

              <div className="px-4 pb-2">
                <p className="text-slate-300 mb-3">{post.content}</p>
                {post.image && <img src={post.image} className="rounded-2xl w-full border border-slate-800" alt="post" />}
                {post.calories && (
                  <div className="mt-3 bg-slate-950/50 p-2 rounded-xl inline-block border border-slate-700 text-xs text-emerald-400 font-mono">
                    {post.calories}
                  </div>
                )}
              </div>

              {/* Koç Demir */}
              {post.aiComment && (
                <div className="mx-4 mb-4 p-3 bg-amber-500/10 border-l-4 border-amber-500 rounded-r-xl">
                  <p className="text-sm italic text-amber-200">{post.aiComment}</p>
                </div>
              )}

              {/* Etkileşim Butonları */}
              <div className="p-4 border-t border-slate-800 flex flex-col gap-3">
                <div className="flex gap-6">
                  <button 
                    onClick={() => handleLike(post.id)}
                    className="flex items-center gap-1.5 text-slate-400 hover:text-pink-500 transition"
                  >
                    ❤️ {post.likes}
                  </button>
                  <button className="flex items-center gap-1.5 text-slate-400 hover:text-blue-400 transition">
                    💬 {post.comments?.length || 0}
                  </button>
                </div>

                {/* Yorumlar Listesi */}
                {post.comments?.map((c, i) => (
                  <div key={i} className="text-xs bg-slate-950/40 p-2 rounded-lg">
                    <span className="font-bold text-purple-400">{c.user}: </span>
                    <span className="text-slate-400">{c.text}</span>
                  </div>
                ))}

                {/* Yorum Yazma Alanı */}
                <input 
                  type="text"
                  placeholder="Yorum ekle..."
                  className="bg-slate-800 border-none rounded-xl text-xs p-2 focus:ring-1 focus:ring-purple-500 outline-none"
                  onKeyDown={(e) => {
                    if (e.key === "Enter") {
                      handleAddComment(post.id, e.target.value);
                      e.target.value = "";
                    }
                  }}
                />
              </div>
            </div>
          ))}
        </div>
      </main>
    </div>
  );
}

export default FeedPage;