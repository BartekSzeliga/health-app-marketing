DIECIK — MATERIAŁY MOBILE — 30.10.2026

STATUS KOŃCOWY
W Google Play i App Store zapisano szkice z nowym kompletem po 8 screenshotów
rzeczywistej aplikacji natywnej. Zapisano również 3 grafiki kampanii i finalne
teksty. Nie opublikowano zmian, nie wysłano aplikacji do review i nie przesłano
ani nie wybrano nowego buildu. App Store: 1.0.22, Prepare for Submission.
Obie karty sklepów pozostawiono otwarte na nowych materiałach.

Google Play: wgrano 8 PNG 1080×1920 w kolejności 01–08 i usunięto wszystkie
8 poprzednich screenshotów telefonu ze szkicu. Konsola potwierdziła zapis.
Tablet 7/10 cali, komputery i Android XR są puste; pole wideo jest puste.

App Store: wgrano 8 PNG 1206×2622 i sprawdzono ich zapis po ponownej nawigacji.
Usunięto stare przypisania 10 obrazów i 3 filmów Face ID large oraz 6 obrazów
Home Button medium. Wszystkie 8 używanych grup iPhone dziedziczy nowy komplet
01–08, bez starych filmów. iPhone Duo jest pusty jak wcześniej; 5 grup iPad,
Apple Watch i 14 grup iMessage sprawdzono — są puste. Poprzednie pliki nadal
pozostają w Asset Library. Dodatkowych rozmiarów iOS nie przypisywano osobno.

ZAWARTOŚĆ
approved-graphics/ — 3 zatwierdzone i zapisane w konsolach grafiki + ich SVG:
  google-feature-1024x500.jpg
  apple-header-v2-3840x1646.png
  apple-search-v2-3840x2560.png
Apple przyjęło PNG; wcześniejszego wariantu JPG nie używamy. Fotografia
redakcyjna została wygenerowana jako bitmapa 1672×941 i przeskalowana w składzie;
napisy i elementy wektorowe renderowano w rozdzielczości końcowej.

app-screenshots/ — 32 końcowe PNG RGB bez alpha i 32 edytowalne SVG:
  ios-1206x2622/        8 obrazów — użyty komplet App Store
  ios-1284x2778/        8 obrazów — dodatkowy wariant, nie przypisany w konsoli
  ios-750x1334/         8 obrazów — dodatkowy wariant, nie przypisany w konsoli
  android-1080x1920/    8 obrazów — użyty komplet Google Play
Każdy zestaw ma kolejność: dieta, konfiguracja generatora, przepis, trening,
instrukcja ćwiczenia, postępy, dieta od specjalisty, lista zakupów. Nagłówek
listy zakupów jasno wskazuje Premium. Wszystkie dane są demonstracyjne.

native-sources/ — 8 oryginalnych przechwyceń iOS i 8 Android do pochodzenia
i dalszej edycji. Te oryginały mogą mieć kanał alpha i elementy systemowe;
do sklepu służą końcowe PNG z app-screenshots/.

contact-sheets/ — 4 plansze przeglądowe aktualnych kompletów.
copy/ — finalne polskie teksty sklepowe i kolejność nagłówków 01–08.
checks/ — QA, SHA256, manifesty źródeł, potwierdzenie uploadu i raport odbioru.
proof/ — 7 bezpiecznych obrazów potwierdzających zapis grafik i screenshotów.
package-manifest.json — lista plików z rozmiarem i SHA256; nie hashuje sam siebie.

POCHODZENIE I WERYFIKACJA
Wszystkie 16 źródeł ekranów pochodzi z rzeczywistych aplikacji natywnych
uruchomionych lokalnie: iOS Device Hub i Android Studio Running Devices.
W końcowym zestawie nie ma Expo Web ani archiwalnych screenshotów. Zachowano
oryginalną bitmapę aplikacji; usunięto tylko opisane obszary systemowe i dodano
zewnętrzne nagłówki. Nie rekonstruowano ani nie domalowywano interfejsu.
Sprawdzono wymiary, RGB bez alpha, polskie fonty, granice tekstu, oryginały
osadzonych bitmap, SHA źródeł i wyników. Obejrzano komplety obu platform oraz
rzeczywisty podgląd Apple. Integralność ZIP i SHA plików sprawdzono po zapisie.

iOS: klient developerski 1.0.17 (39), aktualny kod React Native z własnego
snapshotu. Android: klient developerski 1.0.16 (58), osobny snapshot lokalnego
kodu. To nie są przechwycenia wybranego buildu 1.0.22. Równoległa konsola
zmieniała część kodu, więc nie twierdzimy, że pełne drzewa JS obu platform
były identyczne. Hash odpowiedzi bundle Android dotyczy chwili obserwacji,
nie dowodzi historycznych bajtów załadowanych wcześniej na urządzeniu.

WYKRYTE OGRANICZENIE — GENERATOR
Podczas lokalnego QA Android wygenerował rzeczywisty podgląd tygodnia,
ale zapis został odrzucony walidacją porcji:
„Porcje w podglądzie nie odpowiadają przepisowi lub dopuszczalnej wielkości
posiłku. Wygeneruj ten dzień ponownie. Plan nie został zmieniony.”
Podgląd odrzucono, istniejącej diety nie nadpisano. Kadr 02 pokazuje prawdziwą
konfigurację i nie sugeruje pomyślnie zapisanego planu. Nie naprawiano generatora
w tym zadaniu; zajmuje się nim inna konsola. Szczegóły: checks/android-HANDOFF.md.

PACZKA
Poprzedni katalog PREVIEWS został zastąpiony kompletem natywnym i nie wchodzi
do ZIP. Paczka nie zawiera node_modules, runtime, kodu aplikacji, fontów,
plików kont, haseł, tokenów, pełnych zrzutów AX ani archiwów roboczych.
Nie zmieniano kodu ani danych produkcyjnych. Własne emulatory QA i Metro
zatrzymano; istniejące serwisy użytkownika pozostawiono bez restartu.
