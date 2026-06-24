/**
 * FitPlate - Friends Page
 * Facebook-inspired friendship management interface
 */
import { useState, useEffect, useCallback, useMemo } from "react";
import { Select, Avatar, Spin } from "antd";
import { UserOutlined } from "@ant-design/icons";
import { motion, AnimatePresence } from "framer-motion";
import { toast } from "react-toastify";
import { friendService } from "../services/friendService";
import "./FriendsPage.css";

const TABS = [
  { key: "friends", label: "Arkadaşlarım", icon: "👥" },
  { key: "requests", label: "Gelen İstekler", icon: "📩" },
  { key: "sent", label: "Gönderilen", icon: "📤" },
  { key: "add", label: "Arkadaş Ekle", icon: "➕" },
];

const AVATAR_GRADIENTS = [
  "gradient-1",
  "gradient-2",
  "gradient-3",
  "gradient-4",
  "gradient-5",
  "gradient-6",
];

function getAvatarGradient(id) {
  return AVATAR_GRADIENTS[(id || 0) % AVATAR_GRADIENTS.length];
}

function getInitials(name) {
  if (!name) return "?";
  return name
    .split(" ")
    .map((w) => w[0])
    .join("")
    .toUpperCase()
    .slice(0, 2);
}

function formatDate(dateStr) {
  if (!dateStr) return "";
  const d = new Date(dateStr);
  const now = new Date();
  const diff = now - d;
  const mins = Math.floor(diff / 60000);
  const hours = Math.floor(diff / 3600000);
  const days = Math.floor(diff / 86400000);

  if (mins < 1) return "Az önce";
  if (mins < 60) return `${mins} dk önce`;
  if (hours < 24) return `${hours} saat önce`;
  if (days < 7) return `${days} gün önce`;
  return d.toLocaleDateString("tr-TR", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}

/* ===== Confirm Modal ===== */
function ConfirmModal({ title, message, onConfirm, onCancel }) {
  return (
    <div className="confirm-overlay" onClick={onCancel}>
      <motion.div
        className="confirm-modal"
        initial={{ opacity: 0, y: 16, scale: 0.96 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        exit={{ opacity: 0, y: 8, scale: 0.97 }}
        onClick={(e) => e.stopPropagation()}
      >
        <h3>{title}</h3>
        <p>{message}</p>
        <div className="confirm-modal-actions">
          <button className="confirm-btn-cancel" onClick={onCancel}>
            Vazgeç
          </button>
          <button className="confirm-btn-danger" onClick={onConfirm}>
            Onayla
          </button>
        </div>
      </motion.div>
    </div>
  );
}

/* ===== Skeleton Loader ===== */
function SkeletonCards({ count = 6 }) {
  return (
    <div className="friends-skeleton-grid">
      {Array.from({ length: count }).map((_, i) => (
        <div className="friend-skeleton-card" key={i}>
          <div className="skeleton-banner" />
          <div className="skeleton-body">
            <div className="skeleton-avatar" />
            <div className="skeleton-name" />
            <div className="skeleton-email" />
            <div className="skeleton-btn" />
          </div>
        </div>
      ))}
    </div>
  );
}

/* ===== Empty State ===== */
function EmptyState({ icon, title, description }) {
  return (
    <motion.div
      className="friends-empty"
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4 }}
    >
      <div className="friends-empty-icon">{icon}</div>
      <h3>{title}</h3>
      <p>{description}</p>
    </motion.div>
  );
}

/* ===== Friend Card ===== */
function FriendCard({ person, actions, dateLabel, animDelay = 0 }) {
  return (
    <motion.div
      className="friend-card"
      initial={{ opacity: 0, y: 20, scale: 0.95 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      exit={{ opacity: 0, scale: 0.9, y: -10 }}
      transition={{ duration: 0.35, delay: animDelay }}
      layout
    >
      <div className="friend-card-banner" />
      <div className="friend-card-body">
        <div className={`friend-card-avatar ${getAvatarGradient(person.id)}`}>
          {getInitials(person.name)}
        </div>
        <div className="friend-card-name">{person.name || "İsimsiz"}</div>
        <div className="friend-card-email">{person.email}</div>
        {dateLabel && <div className="friend-card-date">{dateLabel}</div>}
        {actions && <div className="friend-card-actions">{actions}</div>}
      </div>
    </motion.div>
  );
}

/* ===== MAIN COMPONENT ===== */
export default function FriendsPage() {
  const [activeTab, setActiveTab] = useState("friends");
  const [friends, setFriends] = useState([]);
  const [receivedRequests, setReceivedRequests] = useState([]);
  const [sentRequests, setSentRequests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [addFriendId, setAddFriendId] = useState(null);
  const [sendingRequest, setSendingRequest] = useState(false);
  const [confirmModal, setConfirmModal] = useState(null);
  const [searchUsersList, setSearchUsersList] = useState([]);
  const [searchingUsers, setSearchingUsers] = useState(false);

  const fetchAll = useCallback(async () => {
    setLoading(true);
    try {
      const [friendsRes, requestsRes] = await Promise.all([
        friendService.getFriends(),
        friendService.getPendingRequests(),
      ]);
      setFriends(friendsRes.data?.friends || []);
      setReceivedRequests(requestsRes.data?.received || []);
      setSentRequests(requestsRes.data?.sent || []);
    } catch {
      toast.error("Veriler yüklenirken hata oluştu.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchAll();
  }, [fetchAll]);

  const handleAccept = async (requestId) => {
    setActionLoading(requestId);
    try {
      await friendService.acceptRequest(requestId);
      toast.success("Arkadaşlık isteği kabul edildi!");
      await fetchAll();
    } catch {
      toast.error("İstek kabul edilemedi.");
    } finally {
      setActionLoading(null);
    }
  };

  const handleDecline = async (requestId) => {
    setActionLoading(requestId);
    try {
      await friendService.declineRequest(requestId);
      toast.info("Arkadaşlık isteği reddedildi.");
      await fetchAll();
    } catch {
      toast.error("İstek reddedilemedi.");
    } finally {
      setActionLoading(null);
    }
  };

  const handleRemoveFriend = (friendId, friendName) => {
    setConfirmModal({
      title: "Arkadaşı Çıkar",
      message: `${friendName || "Bu kişi"} artık arkadaş listenizde olmayacak. Emin misiniz?`,
      onConfirm: async () => {
        setConfirmModal(null);
        setActionLoading(friendId);
        try {
          await friendService.removeFriend(friendId);
          toast.info("Arkadaş çıkarıldı.");
          await fetchAll();
        } catch {
          toast.error("Arkadaş silinemedi.");
        } finally {
          setActionLoading(null);
        }
      },
    });
  };

  const handleSearchUsers = async (value) => {
    if (!value || value.trim().length < 2) {
      setSearchUsersList([]);
      return;
    }
    setSearchingUsers(true);
    try {
      const res = await friendService.searchUsers(value);
      setSearchUsersList(res.data?.users || []);
    } catch (err) {
      console.error(err);
    } finally {
      setSearchingUsers(false);
    }
  };

  const handleSendRequest = async () => {
    if (!addFriendId) {
      toast.warn("Lütfen bir kullanıcı seçin.");
      return;
    }
    setSendingRequest(true);
    try {
      await friendService.sendRequest(addFriendId);
      toast.success("Arkadaşlık isteği gönderildi!");
      setAddFriendId(null);
      setSearchUsersList([]);
      await fetchAll();
      setActiveTab("sent");
    } catch (err) {
      const msg =
        err.response?.data?.message || "İstek gönderilemedi.";
      toast.error(msg);
    } finally {
      setSendingRequest(false);
    }
  };

  /* Filtering */
  const filteredFriends = useMemo(() => {
    if (!searchQuery.trim()) return friends;
    const q = searchQuery.toLowerCase();
    return friends.filter(
      (f) =>
        f.name?.toLowerCase().includes(q) ||
        f.email?.toLowerCase().includes(q)
    );
  }, [friends, searchQuery]);

  const filteredReceived = useMemo(() => {
    if (!searchQuery.trim()) return receivedRequests;
    const q = searchQuery.toLowerCase();
    return receivedRequests.filter(
      (r) =>
        r.name?.toLowerCase().includes(q) ||
        r.email?.toLowerCase().includes(q)
    );
  }, [receivedRequests, searchQuery]);

  const filteredSent = useMemo(() => {
    if (!searchQuery.trim()) return sentRequests;
    const q = searchQuery.toLowerCase();
    return sentRequests.filter(
      (r) =>
        r.name?.toLowerCase().includes(q) ||
        r.email?.toLowerCase().includes(q)
    );
  }, [sentRequests, searchQuery]);

  return (
    <div>
      {/* Page Header */}
      <div className="friends-page-header">
        <h1>Arkadaşlar</h1>
        <div className="friends-header-stats">
          <div className="friends-stat-badge">
            <span className="stat-number">{friends.length}</span>
            Arkadaş
          </div>
          <div className="friends-stat-badge">
            <span className="stat-number">{receivedRequests.length}</span>
            Bekleyen
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="friends-tabs">
        {TABS.map((tab) => (
          <button
            key={tab.key}
            className={`friends-tab ${activeTab === tab.key ? "active" : ""}`}
            onClick={() => setActiveTab(tab.key)}
          >
            <span>{tab.icon}</span>
            <span>{tab.label}</span>
            {tab.key === "requests" && receivedRequests.length > 0 && (
              <span className="tab-badge">{receivedRequests.length}</span>
            )}
            {tab.key === "sent" && sentRequests.length > 0 && (
              <span className="tab-badge">{sentRequests.length}</span>
            )}
          </button>
        ))}
      </div>

      {/* Search */}
      {activeTab !== "add" && (
        <div className="friends-search-bar">
          <span className="friends-search-icon">🔍</span>
          <input
            type="text"
            placeholder={
              activeTab === "friends"
                ? "Arkadaşlarında ara..."
                : activeTab === "requests"
                  ? "Gelen isteklerde ara..."
                  : "Gönderilen isteklerde ara..."
            }
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>
      )}

      {/* Content */}
      {loading ? (
        <SkeletonCards />
      ) : (
        <AnimatePresence mode="wait">
          {/* TAB: Friends List */}
          {activeTab === "friends" && (
            <motion.div
              key="friends"
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: 20 }}
              transition={{ duration: 0.25 }}
            >
              {filteredFriends.length === 0 ? (
                <EmptyState
                  icon="👥"
                  title={
                    searchQuery
                      ? "Sonuç bulunamadı"
                      : "Henüz arkadaşın yok"
                  }
                  description={
                    searchQuery
                      ? "Farklı bir arama deneyin."
                      : "Arkadaş ekleyerek sosyal çevreni genişlet!"
                  }
                />
              ) : (
                <div className="friends-grid">
                  <AnimatePresence>
                    {filteredFriends.map((friend, idx) => (
                      <FriendCard
                        key={friend.id}
                        person={friend}
                        animDelay={idx * 0.05}
                        actions={
                          <button
                            className="btn-remove"
                            onClick={() =>
                              handleRemoveFriend(friend.id, friend.name)
                            }
                            disabled={actionLoading === friend.id}
                          >
                            {actionLoading === friend.id
                              ? "⏳"
                              : "✕"}{" "}
                            Çıkar
                          </button>
                        }
                      />
                    ))}
                  </AnimatePresence>
                </div>
              )}
            </motion.div>
          )}

          {/* TAB: Received Requests */}
          {activeTab === "requests" && (
            <motion.div
              key="requests"
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: 20 }}
              transition={{ duration: 0.25 }}
            >
              <div className="request-section">
                <div className="request-section-title">
                  <span className="section-icon received">📩</span>
                  Gelen Arkadaşlık İstekleri
                </div>

                {filteredReceived.length === 0 ? (
                  <EmptyState
                    icon="📭"
                    title={
                      searchQuery
                        ? "Sonuç bulunamadı"
                        : "Gelen istek yok"
                    }
                    description={
                      searchQuery
                        ? "Farklı bir arama deneyin."
                        : "Şu an bekleyen arkadaşlık isteğin bulunmuyor."
                    }
                  />
                ) : (
                  <div className="friends-grid">
                    <AnimatePresence>
                      {filteredReceived.map((req, idx) => (
                        <FriendCard
                          key={req.request_id}
                          person={req}
                          dateLabel={formatDate(req.created_at)}
                          animDelay={idx * 0.05}
                          actions={
                            <>
                              <button
                                className="btn-accept"
                                onClick={() =>
                                  handleAccept(req.request_id)
                                }
                                disabled={
                                  actionLoading === req.request_id
                                }
                              >
                                {actionLoading === req.request_id
                                  ? "⏳"
                                  : "✓"}{" "}
                                Kabul Et
                              </button>
                              <button
                                className="btn-decline"
                                onClick={() =>
                                  handleDecline(req.request_id)
                                }
                                disabled={
                                  actionLoading === req.request_id
                                }
                              >
                                ✕ Reddet
                              </button>
                            </>
                          }
                        />
                      ))}
                    </AnimatePresence>
                  </div>
                )}
              </div>
            </motion.div>
          )}

          {/* TAB: Sent Requests */}
          {activeTab === "sent" && (
            <motion.div
              key="sent"
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: 20 }}
              transition={{ duration: 0.25 }}
            >
              <div className="request-section">
                <div className="request-section-title">
                  <span className="section-icon sent">📤</span>
                  Gönderilen Arkadaşlık İstekleri
                </div>

                {filteredSent.length === 0 ? (
                  <EmptyState
                    icon="📭"
                    title={
                      searchQuery
                        ? "Sonuç bulunamadı"
                        : "Gönderilen istek yok"
                    }
                    description={
                      searchQuery
                        ? "Farklı bir arama deneyin."
                        : "Henüz kimseye arkadaşlık isteği göndermemişsin."
                    }
                  />
                ) : (
                  <div className="friends-grid">
                    <AnimatePresence>
                      {filteredSent.map((req, idx) => (
                        <FriendCard
                          key={req.request_id}
                          person={req}
                          dateLabel={`Gönderildi · ${formatDate(req.created_at)}`}
                          animDelay={idx * 0.05}
                          actions={
                            <button
                              className="btn-cancel-request"
                              onClick={() =>
                                handleDecline(req.request_id)
                              }
                              disabled={
                                actionLoading === req.request_id
                              }
                            >
                              {actionLoading === req.request_id
                                ? "⏳"
                                : "↩"}{" "}
                              İptal Et
                            </button>
                          }
                        />
                      ))}
                    </AnimatePresence>
                  </div>
                )}
              </div>
            </motion.div>
          )}

          {/* TAB: Add Friend */}
          {activeTab === "add" && (
            <motion.div
              key="add"
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: 20 }}
              transition={{ duration: 0.25 }}
            >
              <div className="add-friend-section">
                <div className="add-friend-title">
                  <span className="title-icon">👋</span>
                  Arkadaşlık İsteği Gönder
                </div>
                <div className="add-friend-form" style={{ display: 'flex', gap: 10, background: 'none', padding: 0 }}>
                  <Select
                    showSearch
                    placeholder="Kullanıcı adına göre ara..."
                    style={{ flex: 1 }}
                    size="large"
                    defaultActiveFirstOption={false}
                    filterOption={false}
                    onSearch={handleSearchUsers}
                    onChange={setAddFriendId}
                    value={addFriendId}
                    notFoundContent={searchingUsers ? <Spin size="small" /> : "Kullanıcı bulunamadı."}
                    options={searchUsersList.map((d) => ({
                      value: d.id,
                      label: (
                        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                          <Avatar 
                            src={getImageUrl(d.profile_photo)}
                            icon={!d.profile_photo && <UserOutlined />}
                            size="small"
                          />
                          <div style={{ display: 'flex', flexDirection: 'column' }}>
                            <span style={{ lineHeight: '1.2' }}>{d.name}</span>
                            <span style={{ fontSize: '11px', color: 'rgba(255,255,255,0.45)' }}>@{d.username}</span>
                          </div>
                        </div>
                      ),
                    }))}
                  />
                  <button
                    onClick={handleSendRequest}
                    disabled={sendingRequest || !addFriendId}
                  >
                    {sendingRequest ? "⏳ Gönderiliyor..." : "📨 İstek Gönder"}
                  </button>
                </div>
              </div>

              <EmptyState
                icon="🤝"
                title="Arkadaşlarını Bul"
                description="Kullanıcı ID'si ile arkadaşlarına istek gönder ve sosyal çevreni genişlet!"
              />
            </motion.div>
          )}
        </AnimatePresence>
      )}

      {/* Confirm Modal */}
      <AnimatePresence>
        {confirmModal && (
          <ConfirmModal
            title={confirmModal.title}
            message={confirmModal.message}
            onConfirm={confirmModal.onConfirm}
            onCancel={() => setConfirmModal(null)}
          />
        )}
      </AnimatePresence>
    </div>
  );
}
