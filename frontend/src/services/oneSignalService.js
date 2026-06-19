/**
 * FitPlate - OneSignal Push Notification Service
 * SDK initialization, user binding, and permission handling
 */

const ONESIGNAL_APP_ID = import.meta.env.VITE_ONESIGNAL_APP_ID || "";

let isInitialized = false;

/**
 * OneSignal Web SDK'yı başlatır.
 * Uygulama mount edilmeden önce (main.jsx) bir kez çağrılmalıdır.
 */
export async function initOneSignal() {
  if (isInitialized || !ONESIGNAL_APP_ID) {
    if (!ONESIGNAL_APP_ID) {
      console.warn(
        "[OneSignal] VITE_ONESIGNAL_APP_ID tanımlı değil. Push bildirimleri devre dışı.",
      );
    }
    return;
  }

  try {
    const OneSignalModule = await import(
      /* webpackIgnore: true */ "https://cdn.onesignal.com/sdks/web/v16/OneSignalSDK.page.js"
    ).catch(() => null);

    if (!window.OneSignalDeferred) {
      window.OneSignalDeferred = [];
    }

    window.OneSignalDeferred.push(async function (OneSignal) {
      await OneSignal.init({
        appId: ONESIGNAL_APP_ID,
        notifyButton: { enable: false },
        serviceWorkerParam: { scope: "/" },
        serviceWorkerPath: "/OneSignalSDKWorker.js",
      });

      isInitialized = true;
      console.info("[OneSignal] SDK başarıyla başlatıldı.");
    });
  } catch (error) {
    console.error("[OneSignal] SDK başlatma hatası:", error);
  }
}

/**
 * Kullanıcı login olduğunda OneSignal external_id'yi ayarlar.
 * Bu sayede sunucu tarafından belirli kullanıcıya bildirim gönderilebilir.
 */
export async function setOneSignalExternalUserId(userId) {
  if (!userId) return;

  try {
    if (window.OneSignalDeferred) {
      window.OneSignalDeferred.push(async function (OneSignal) {
        await OneSignal.login(String(userId));
        console.info("[OneSignal] External user ID ayarlandı:", userId);
      });
    }
  } catch (error) {
    console.error("[OneSignal] External user ID hatası:", error);
  }
}

/**
 * Kullanıcı logout olduğunda OneSignal bağlantısını koparır.
 */
export async function removeOneSignalExternalUserId() {
  try {
    if (window.OneSignalDeferred) {
      window.OneSignalDeferred.push(async function (OneSignal) {
        await OneSignal.logout();
        console.info("[OneSignal] External user ID temizlendi.");
      });
    }
  } catch (error) {
    console.error("[OneSignal] Logout hatası:", error);
  }
}

/**
 * Kullanıcıdan push bildirim izni ister.
 * Genellikle onboarding veya settings sayfasından çağrılır.
 */
export async function promptForPush() {
  try {
    if (window.OneSignalDeferred) {
      window.OneSignalDeferred.push(async function (OneSignal) {
        const permission =
          await OneSignal.Notifications.requestPermission();
        console.info("[OneSignal] Bildirim izni durumu:", permission);
        return permission;
      });
    }
  } catch (error) {
    console.error("[OneSignal] İzin isteme hatası:", error);
  }
}

/**
 * Mevcut bildirim izin durumunu döndürür.
 */
export function getPushPermissionStatus() {
  if (typeof Notification !== "undefined") {
    return Notification.permission;
  }
  return "default";
}
