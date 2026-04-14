import React, { useState, useRef } from 'react';

const Sahne1 = () => {
  // --- DURUM YÖNETİMİ (STATE) ---
  const [inputText, setInputText] = useState("");
  const [isProcessed, setIsProcessed] = useState(false);
  const [selectedImage, setSelectedImage] = useState(null);
  const [isRecording, setIsRecording] = useState(false);
  const [activeTab, setActiveTab] = useState("home");

  const fileInputRef = useRef(null);

  // --- FONKSİYONLAR ---

  // 1. Fotoğraf Seçme ve Önizleme
  const handlePhotoClick = () => {
    fileInputRef.current.click();
  };

  const handleImageChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setSelectedImage(reader.result);
        setInputText("Fotoğraf analiz edildi: Latte ve Kruvasan tespit edildi. ✨");
      };
      reader.readAsDataURL(file);
    }
  };

  // 2. Sesli Giriş Simülasyonu (2 saniye sürer)
  const handleMicClick = () => {
    setIsRecording(true);
    setInputText("Dinleniyor...");
    setTimeout(() => {
      setIsRecording(false);
      setInputText("Yulaf sütlü toffee nut latte ve kruvasan gömüyorum");
    }, 2000);
  };

  // 3. Form Gönderimi (Post Oluşturma)
  const handleSubmit = (e) => {
    e.preventDefault();
    if (inputText.trim()) {
      setIsProcessed(true);
      // Post oluştuktan sonra inputu temizlemek istersen:
      // setInputText(""); 
    }
  };

  // 4. Navbar Buton Fonksiyonları
  const handleNavAction = (tab) => {
    setActiveTab(tab);
    if (tab === "home") {
      // Sayfayı başa döndürür
      setIsProcessed(false);
      setSelectedImage(null);
      setInputText("");
    } else {
      // Diğer sekmeler için şimdilik uyarı veriyoruz
      console.log(`${tab} sekmesine geçildi.`);
    }
  };

  return (
    <div className="min-vh-100 d-flex flex-column shadow-lg" style={{ backgroundColor: '#F1F3E0', fontFamily: 'sans-serif' }}>
      
      {/* Gizli Dosya Girişi */}
      <input 
        type="file" 
        ref={fileInputRef} 
        onChange={handleImageChange} 
        accept="image/*" 
        style={{ display: 'none' }} 
      />

      {/* ÜST NAVİGASYON */}
      <nav className="navbar shadow-sm px-4 fixed-top w-100" style={{ background: 'linear-gradient(90deg, #2E7D32 0%, #689F38 100%)', height: '70px', zIndex: 1000 }}>
        <span className="navbar-brand fw-bold text-white fs-3">
          Ghost<span style={{ color: '#FFEB3B' }}>Plate</span>
        </span>
        <div className="d-flex align-items-center gap-3">
          <span className="text-white d-none d-md-inline small fw-bold">Hoş geldin, Demir!</span>
          <div className="bg-white rounded-circle p-1 shadow-sm">
            <i className="bi bi-person-fill text-success fs-5 px-1"></i>
          </div>
        </div>
      </nav>

      {/* ANA İÇERİK (Padding-top navbar için önemli) */}
      <div className="container-fluid flex-grow-1 px-md-5" style={{ marginTop: '90px', marginBottom: '100px' }}>
        <div className="row g-4">
          
          {/* SOL PANEL - İSTATİSTİK */}
          <div className="col-lg-3 d-none d-lg-block">
            <div className="card border-0 shadow-sm rounded-4 p-4 mb-4 bg-white border-top border-success border-4">
              <h6 className="fw-bold text-success mb-3">Haftalık Analiz</h6>
              <div className="text-center py-4 bg-light rounded-4 mb-3">
                <div className="display-5 fw-bold text-dark">{isProcessed ? "650" : "0"}</div>
                <div className="small text-muted fw-bold text-uppercase">Kcal Kaydedildi</div>
              </div>
              <div className="progress rounded-pill" style={{ height: '10px' }}>
                <div className="progress-bar bg-success progress-bar-striped progress-bar-animated" style={{ width: isProcessed ? '25%' : '0%' }}></div>
              </div>
            </div>

            <div className="card border-0 shadow-sm rounded-4 p-4 bg-dark text-white border-top border-warning border-4">
              <h6 className="fw-bold text-warning mb-3">Ghost AI Modu</h6>
              <div className="d-flex align-items-center gap-2 text-success small mb-2">
                <div className={`spinner-grow spinner-grow-sm ${isRecording ? 'text-danger' : 'text-success'}`} role="status"></div>
                {isRecording ? "Ses İşleniyor..." : "Analiz Motoru Hazır"}
              </div>
              <p className="small opacity-75 mb-0">Görüntü ve ses tanıma modülleri şu an aktif.</p>
            </div>
          </div>

          {/* ORTA PANEL - AKIŞ */}
          <div className="col-lg-6">
            <div className="card border-0 shadow-lg rounded-5 mb-4 bg-white overflow-hidden">
              <div className="card-body p-4 p-md-5">
                <h4 className="fw-bold text-center mb-4 text-dark">Bugün ne yiyoruz? ✨</h4>
                
                <div className="d-flex gap-3 mb-4 justify-content-center">
                  <button 
                    onClick={handlePhotoClick}
                    className="btn btn-lg rounded-4 px-4 border-0 shadow-sm transition-all" 
                    style={{ backgroundColor: selectedImage ? '#C8E6C9' : '#E8F5E9', color: '#2E7D32' }}>
                    <i className={`bi ${selectedImage ? 'bi-check-circle-fill' : 'bi-camera-fill'} me-2`}></i>
                    {selectedImage ? "Foto Hazır" : "Fotoğraf"}
                  </button>

                  <button 
                    onClick={handleMicClick}
                    className={`btn btn-lg rounded-4 px-4 border-0 shadow-sm ${isRecording ? 'bg-danger text-white pulse' : ''}`}
                    style={!isRecording ? { backgroundColor: '#FFFDE7', color: '#FBC02D' } : {}}>
                    <i className={`bi ${isRecording ? 'bi-record-circle' : 'bi-mic-fill'} me-2`}></i>
                    {isRecording ? "Dinleniyor..." : "Sesli Giriş"}
                  </button>
                </div>
                
                <form onSubmit={handleSubmit}>
                  <div className="input-group p-2 rounded-pill shadow-sm border border-2 border-light-subtle bg-white">
                    <input 
                      type="text" 
                      className="form-control border-0 bg-transparent ps-4 fs-5" 
                      placeholder="Örn: 2 yumurta ve tam buğday ekmeği..."
                      value={inputText}
                      onChange={(e) => setInputText(e.target.value)}
                    />
                    <button className="btn btn-success rounded-circle shadow p-0 d-flex align-items-center justify-content-center" 
                            style={{ width: '55px', height: '55px' }} type="submit">
                      <i className="bi bi-stars text-white fs-4"></i>
                    </button>
                  </div>
                </form>
              </div>
            </div>

            {/* PAYLAŞILAN POST */}
            {isProcessed && (
              <div className="card border-0 shadow-lg rounded-5 overflow-hidden mx-auto mb-5 slide-up" style={{maxWidth: '550px'}}>
                <div className="p-3 d-flex align-items-center bg-white border-bottom">
                  <div className="bg-success rounded-circle me-2" style={{ width: '35px', height: '35px' }}></div>
                  <span className="fw-bold small text-dark">Demir Aktaş</span>
                </div>
                
                <img 
                  src={selectedImage || "https://images.unsplash.com/photo-1517701604599-bb29b565090c?auto=format&fit=crop&q=80&w=600"} 
                  className="w-100" 
                  style={{maxHeight: '400px', objectFit: 'cover'}} 
                  alt="meal" 
                />
                
                <div className="card-body bg-white">
                  <div className="badge bg-warning text-dark mb-2 px-3 py-2 rounded-pill shadow-sm">⚡ 650 kcal</div>
                  <p className="mb-0 text-dark"><strong>Demir Aktaş:</strong> {inputText}</p>
                  
                  {/* KOÇ DEMİR YORUMU */}
                  <div className="mt-4 pt-3 border-top">
                    <div className="d-flex gap-2">
                       <div className="bg-danger rounded-circle text-white d-flex align-items-center justify-content-center fw-bold" style={{width: '35px', height: '35px', minWidth: '35px', fontSize: '10px'}}>DK</div>
                       <div className="bg-light p-3 rounded-4 border-start border-danger border-4 w-100 shadow-sm">
                          <span className="fw-bold d-block text-danger small">Premium Koç: DEMİR (SERT)</span>
                          <small className="text-dark fst-italic">"Sabah sabah o karbonhidrat bombası ne? Öğlen sıfır şeker, sadece tavuk-salata! Sakın itiraz etme."</small>
                       </div>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* SAĞ PANEL - TOPLULUK */}
          <div className="col-lg-3 d-none d-lg-block">
            <div className="card border-0 shadow-sm rounded-4 p-4 bg-white border-top border-danger border-4 mb-4">
              <h6 className="fw-bold text-danger mb-3"><i className="bi bi-shield-fill-check me-2"></i>Premium Koç</h6>
              <div className="p-3 rounded-4" style={{backgroundColor: '#FFF5F5'}}>
                <small className="fw-bold text-danger d-block mb-1">KOÇ MESAJI:</small>
                <p className="small mb-0">"Veri girişini aksatma, seni izliyorum."</p>
              </div>
            </div>

            <div className="card border-0 shadow-sm rounded-4 p-4 bg-white">
              <h6 className="fw-bold text-dark border-bottom pb-3 mb-3">Topluluk Akışı</h6>
              {[1, 2].map((u) => (
                <div key={u} className="d-flex align-items-center gap-3 mb-4">
                  <div className="bg-secondary bg-opacity-10 rounded-circle p-2"><i className="bi bi-person text-secondary"></i></div>
                  <div className="small">
                    <div className="fw-bold">Kullanıcı_{u * 23}</div>
                    <div className="text-muted" style={{fontSize: '0.7rem'}}>Öğle yemeğini paylaştı</div>
                  </div>
                </div>
              ))}
            </div>
          </div>

        </div>
      </div>

      {/* ALT NAVİGASYON (AKTİF BUTONLAR) */}
      <div className="fixed-bottom px-4 pb-4">
        <div className="bg-dark shadow-lg d-flex justify-content-around align-items-center py-2 text-white mx-auto rounded-pill" style={{ maxWidth: '480px', border: '1px solid rgba(255,255,255,0.1)' }}>
          <button onClick={() => handleNavAction("home")} className={`btn border-0 ${activeTab === 'home' ? 'text-warning' : 'text-white-50'}`}>
            <i className="bi bi-house-door-fill fs-4"></i>
          </button>
          <button onClick={() => handleNavAction("search")} className={`btn border-0 ${activeTab === 'search' ? 'text-warning' : 'text-white-50'}`}>
            <i className="bi bi-search fs-4"></i>
          </button>
          
          {/* ORTA ARTI BUTONU (Home'u tetikler) */}
          <div onClick={() => handleNavAction("home")} className="bg-success rounded-circle shadow-lg d-flex align-items-center justify-content-center cursor-pointer" 
               style={{ width: '60px', height: '60px', marginTop: '-45px', border: '5px solid #F1F3E0', cursor: 'pointer' }}>
             <i className="bi bi-plus-lg fs-3 fw-bold"></i>
          </div>

          <button onClick={() => handleNavAction("activity")} className={`btn border-0 ${activeTab === 'activity' ? 'text-warning' : 'text-white-50'}`}>
            <i className="bi bi-bar-chart-fill fs-4"></i>
          </button>
          <button onClick={() => handleNavAction("notifications")} className={`btn border-0 ${activeTab === 'notifications' ? 'text-warning' : 'text-white-50'}`}>
            <i className="bi bi-bell-fill fs-4"></i>
          </button>
        </div>
      </div>

      {/* ÖZEL CSS EFEKTLERİ */}
      <style>{`
        .pulse { animation: pulse-red 1.5s infinite; }
        @keyframes pulse-red { 0% { opacity: 1; transform: scale(1); } 50% { opacity: 0.7; transform: scale(1.05); } 100% { opacity: 1; transform: scale(1); } }
        .slide-up { animation: slideUp 0.6s ease-out; }
        @keyframes slideUp { from { transform: translateY(30px); opacity: 0; } to { transform: translateY(0); opacity: 1; } }
        .transition-all { transition: all 0.3s ease; }
        .transition-all:hover { transform: translateY(-3px); box-shadow: 0 4px 15px rgba(0,0,0,0.1) !important; }
        .cursor-pointer { cursor: pointer; }
      `}</style>
    </div>
  );
};

export default Sahne1;