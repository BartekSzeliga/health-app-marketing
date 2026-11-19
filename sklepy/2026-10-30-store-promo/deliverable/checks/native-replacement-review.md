# Pełna wymiana screenshotów mobile — 2026-10-30

## Wynik

W obu konsolach zapisano nowe komplety po osiem obrazów z rzeczywistej aplikacji natywnej. Kolejność: dieta, konfiguracja generatora, przepis, plan treningowy, instrukcja ćwiczenia, postępy, dieta od specjalisty, lista zakupów. Wszystkie pokazują izolowane dane demonstracyjne. Kompozycja zachowuje oryginalne piksele aplikacji; dodano nagłówki promocyjne i jasną informację o Premium przy zakupach.

Google Play: osiem nowych PNG 1080×1920, osiem starych zdjęć wycofanych z draftu. Zapis potwierdzony komunikatem „Zmiany zostały zapisane” i wyłączonym przyciskiem zapisu. Ikona, nowa grafika główna i opisy zachowane. Tablet 7/10 cali, komputery i Android XR sprawdzone: puste. Pole wideo puste.

App Store: osiem nowych PNG 1206×2622, wersja 1.0.22 nadal Prepare for Submission. Zapis utrzymany po nawigacji do innych sekcji i powrocie. Usunięto przypisania starych 10 zdjęć i 3 filmów z Face ID large oraz 6 zdjęć z Home Button medium. Wszystkie osiem używanych grup iPhone pokazuje nowy komplet 01–08 przez dziedziczenie, bez starego wideo. iPhone Duo pusty jak wcześniej; wszystkie pięć grup iPad, Apple Watch oraz czternaście grup iMessage sprawdzone i puste. Poprzednie pliki pozostają w Asset Library. Rzeczywisty Device Preview pokazuje nowy header i nowe screenshoty.

Obie karty pozostawiono otwarte na nowych galeriach. Nie kliknięto Add for Review/Send for Review/Publish i nie przesłano buildu.

## Źródła i weryfikacja

Osiem źródeł iOS z Device Hub (1320×2868) i osiem Android z Android Studio Running Devices (1280×2856). Aktualny kod React Native uruchomiony przez własne lokalne Metro i lokalny backend. Bez użycia Expo Web lub historycznych screenshotów w końcowym zestawie. Formularz generatora pokazuje rzeczywistą konfigurację, nie udaje pomyślnie zapisanego planu.

32 PNG i 32 SVG: po osiem obrazów dla iOS 1206×2622, iOS 1284×2778, iOS 750×1334 oraz Android 1080×1920. Dwa dodatkowe rozmiary iOS dostarczono w paczce; nie tworzono zbędnych nadpisań w konsoli. QA: RGB bez alpha, wymiary, polskie fonty, pozycje tekstu, źródłowe i wynikowe SHA oraz osadzone oryginalne bitmapy PASS. Root obejrzał pełne zestawy obu platform i podgląd Apple. Inna konsola zmieniała kod w trakcie sesji; metadane opisują osobne rzeczywiste snapshoty, bez twierdzenia o identycznym pełnym drzewie JS obu platform.

Główny zapis odbioru: native-store-upload-review.json. Dowody: google-new-native-screenshots-saved.png, apple-new-native-screenshots-version.png, apple-new-native-device-preview.png. Szczegółowy audyt dziedziczenia: apple-new-inheritance-audit.json.

## Wykryte, nienaprawiane w tym zadaniu

Rzeczywista próba zapisu wygenerowanego tygodnia Android została odrzucona komunikatem: „Porcje w podglądzie nie odpowiadają przepisowi lub dopuszczalnej wielkości posiłku. Wygeneruj ten dzień ponownie. Plan nie został zmieniony.” Podgląd odrzucono, poprzedniej diety nie nadpisano. Dowód: android-native/generator-save-validation-error.png; szczegóły: android-native/HANDOFF.md. Generator naprawiany jest w innej konsoli, więc nie zmieniano jego kodu w zadaniu promocyjnym.

Nie publikowano aplikacji ani materiałów na żywo. Build 1.0.22 nie jest wybrany w App Store; ikona w Device Preview jest placeholderem, związanym z brakiem buildu. Nie tworzono screenshotów iPad/Watch/iMessage, których aplikacja w tej sesji nie obsługiwała.

## Porządek środowiska

Zatrzymano wyłącznie własne Metro 8087/8089 i własne emulatory QA. Istniejący backend 8086 PID63931 i frontend 3000 PID3466 działają bez restartu. Kod aplikacji i indeksy Git nietknięte; brak commit/push/deploy/release. Prywatne konta demonstracyjne pozostają poza paczką w pliku z prawami 0600. Stary katalog PREVIEWS został odsunięty od końcowego deliverable.
