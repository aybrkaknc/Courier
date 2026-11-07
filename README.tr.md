<div align="center">

<img src="icons/icon-128.png" alt="" width="104">

# Courier

**Tarayıcınızdan Telegram'a her şeyi gönderin.**

Sayfaları, bağlantıları, seçili metinleri, medyayı ve ekran görüntülerini kendi botunuz üzerinden Telegram'a gönderin. Mesajlar tarayıcınızdan doğrudan Telegram Bot API'ye gider. Arada sunucu yoktur, telemetri toplanmaz.

[English](README.md)

[![İndir](https://img.shields.io/badge/İndir-Son_sürüm-2ea043?style=for-the-badge)](../../releases)

![Platform](https://img.shields.io/badge/Platform-Chrome_ve_Firefox-0078D4)
![Sürüm](https://img.shields.io/badge/sürüm-0.1.0-7b3fb3)
![Lisans](https://img.shields.io/badge/lisans-MIT-blue)

</div>

<br>

## Neler yapabilirsiniz

| Alan | Yapabilecekleriniz |
|---|---|
| **Sayfalar** | Geçerli sayfayı (başlık ve URL) popup, sağ tık menüsü veya kısayolla gönderme |
| **İçerik** | Sağ tık menüsünden bağlantı, seçili metin, resim, video, ses, bağlantıdaki dosya ve açık PDF gönderme |
| **Ekran görüntüleri** | Görünür alanın veya seçili alanın ekran görüntüsünü gönderme |

**Ayrıca:**

- İsteğe bağlı sessiz gönderim ve bağlantı önizlemesini kapatma
- Gönderim başarısız olduğunda açık bir uyarı
- Dil ayarıyla İngilizce ve Türkçe arayüz, açık ve koyu tema

## Başlarken

1. **Kurun.** Eklentiyi [Sürümler sayfasından](../../releases) kurun ya da aşağıdaki gibi kaynaktan derleyin.
2. **Bot oluşturun.** [@BotFather](https://t.me/BotFather) ile bir bot oluşturup token'ı ya da mesajın tamamını kopyalayın.
3. **Token'ı yapıştırın.** Eklenti ayarlarını açıp yapıştırın. Courier token'ı metinden ayıklar ve doğrular.
4. **Chat ID'nizi bulun.** Botunuzu açıp ona bir mesaj gönderin, ardından ayarlarda Chat ID'yi bul düğmesine basın. Grup veya kanal için önce botu ekleyin.
5. **Bağlanın.** Kaydedip test mesajı gönderin.

### Kısayollar

| İşlem | Varsayılan |
|---|---|
| Geçerli sayfayı gönder | Alt+Shift+1 |
| Görünür alanın ekran görüntüsü | Alt+Shift+2 |
| Seçili alanın ekran görüntüsü | Alt+Shift+3 |

## Gereksinimler

- Chrome 116 veya üstü, ya da Firefox 142 veya üstü
- @BotFather'dan alınmış bir Telegram bot token'ı

## Sorular

**Verilerim nereye gidiyor?**
Tarayıcınızdan botunuz üzerinden doğrudan `api.telegram.org` adresine. [PRIVACY.tr.md](PRIVACY.tr.md) dosyasına bakın.

**Sınırlar neler?**
Botlar en fazla 50 MB dosya yükleyebilir. Medya URL'lerini Telegram kendisi çeker; bu başarısız olursa ayarlardan tarayıcıda indirmeyi açabilirsiniz, bu seçenek tüm sitelere erişim izni ister. `blob:` ve akış adresleri gönderilemez.

## Sorun bildirme

Bir sorun çıkarsa bir [issue](../../issues/new/choose) açın; tarayıcıyı, sürümünü ve gördüğünüz hata mesajını ekleyin.

## Katkı

[CONTRIBUTING.md](CONTRIBUTING.md) dosyasına bakın. Güvenlik sorunu bildirmek için [SECURITY.md](SECURITY.md) dosyasına bakın.

## Kaynaktan derleme

Node.js gerekir. Derleme için bağımlılık yoktur.

```
npm run build
npm run lint
```

- Chrome: `chrome://extensions` sayfasını açın, Geliştirici modunu etkinleştirin, "Paketlenmemiş öğe yükle" ile `dist/chrome` klasörünü seçin.
- Firefox: `about:debugging#/runtime/this-firefox` sayfasını açın, "Geçici Eklenti Yükle" ile `dist/firefox/manifest.json` dosyasını seçin.

### Hot reload

- Chrome: `npm run dev` komutunu çalıştırın, ardından `dist/chrome-dev` klasörünü bir kez paketlenmemiş eklenti olarak yükleyin. Dosyayı kaydettiğinizde yeniden derlenir. `popup/` veya `options/` içindeki değişiklikler açık eklenti sekmelerini yeniler; diğer değişiklikler eklentinin tamamını yeniden yükler ve bu sekmeleri kapatır.
- Firefox: `npm run dev:firefox` komutunu çalıştırın. Firefox, `.dev-profile/` içinde saklanan bir profille `web-ext` üzerinden açılır. Firefox varsayılan bir konumda kurulu değilse `FIREFOX_BIN` ortam değişkenine `firefox.exe` yolunu verin.
- Eklenti başlarken hata verirse hatayı düzeltip eklentiler sayfasından bir kez yeniden yükleyin. Söz dizimi hatası olan dosyalar dağıtılmaz.

Geliştirme derlemeleri mağaza paketlerine asla girmez. Bu derlemeler `tabs` iznini ve `127.0.0.1:35871` bağlantısını ekler.

## Lisans

Courier, MIT lisansı altında ücretsiz ve açık kaynaklıdır. Ayrıntılar için [LICENSE](LICENSE) dosyasına bakın.
