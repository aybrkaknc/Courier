# Gizlilik Politikası

[English](PRIVACY.md)

Courier'ın kendi sunucusu yoktur, analiz veya telemetri toplamaz. Geliştirici hiçbir verinizi almaz.

## Cihazınızda saklanan veriler

Bot token'ınız, chat ID'niz ve ayarlarınız tarayıcının yerel eklenti depolamasında tutulur, senkronlanmaz. Ayarlardaki "Tüm verileri sil" düğmesi bunları kaldırır.

Ayarlarda Chat ID'yi bul düğmesine bastığınızda Courier, chat ID'yi okumak için Telegram'dan botun son güncellemelerini ister. Seçtiğiniz chat ID dışında hiçbir şey saklanmaz.

## Telegram'a gönderilen veriler

Yalnızca siz gönderim başlattığınızda, seçtiğiniz içerik botunuz üzerinden `api.telegram.org` adresine gider: sayfa başlığı ve URL'si, bağlantı, seçili metin, medya URL'si veya dosyası ya da ekran görüntüsü. Medya ve ekran görüntüsü açıklamalarında sayfa URL'si bulunur. Medya URL'si gönderdiğinizde bu adresi Telegram sunucuları çeker. Bu veriler için Telegram'ın kendi [gizlilik politikası](https://telegram.org/privacy) geçerlidir.

## İzinler

- `contextMenus`: sağ tık gönderim seçeneklerini ekler.
- `storage`: token, chat ID ve ayarları cihazınızda tutar.
- `activeTab`: yalnızca siz işlem yaptığınızda geçerli sekmenin başlığını ve URL'sini okur ve görüntüsünü alır.
- `scripting`: yalnızca siz işlem yaptığınızda geçerli sekmede alan seçimi katmanını gösterir.
- `api.telegram.org` erişimi: mesajlarınızı gönderir.
- İsteğe bağlı tüm site erişimi: yalnızca tarayıcıda indirmeyi açarsanız, göndermeyi seçtiğiniz medyayı indirmek için kullanılır.
