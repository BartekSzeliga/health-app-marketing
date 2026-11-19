# Diecik: plan wejścia na rynek w Polsce

**Wersja gotowa do przygotowania kampanii | 30.09.2026 | test 30 dni od uruchomienia**

Plan dotyczy dwóch oddzielnych ofert: Diecika dla użytkownika indywidualnego i Diecika dla specjalisty. Materiały oraz konfiguracje kampanii powstają lokalnie. Publikacja reklam, uruchomienie wydatków i zmiany produkcyjne są osobnym krokiem wymagającym aktualnej zgody Bartosza. Nie utworzono aktywnych kampanii na kontach reklamowych.

## 1. Decyzja i pozycjonowanie

**Największą część płatnego testu kierujemy do specjalistów; reklamę konsumencką zaczynamy od ulubionych posiłków.**

- **B2C:** wariant A „Twój smak. Twój skrót.” z komunikatem „Zapisz raz. Dodawaj ponownie.”; wariant B „Lubisz ten posiłek?”. Prawdziwe ujęcie zapisania posiłku i ponownego dodania go do planu. CTA: „Wypróbuj za darmo”. Darmowy plan: do 3 ulubionych; Premium: bez limitu.
- **B2B:** wariant A „Od planu do telefonu klienta.”, wariant B „Plan gotowy. Klient ma go pod ręką.”. Panel specjalisty, przygotowanie diety i status publikacji, a następnie rzeczywisty widok aplikacji klienta jako osobny przykład DEMO. Konkretne ujęcia panelu i telefonu pochodzą z dwóch różnych kont; film nie dokumentuje przekazania jednego planu między nimi. CTA filmu: „Zacznij bezpłatnie”; formularz prezentacji pozostaje osobną ścieżką. Darmowy plan: do 2 aktywnych klientów, bez limitu czasu i bez karty.
- **Wspólna marka:** „Dieta i trening w jednej aplikacji.” Tę obietnicę traktujemy jako kontekst. Pojedyncza reklama pokazuje jedno zadanie i jego rezultat.

To rekomendacja wynikająca z ceny oferty i charakteru produktu, a nie dowód skuteczności kanału. Nie dysponujemy danymi kampanii, potwierdzonym CAC, wolumenem wyszukiwania, retencją ani miksami zakupów Diecika.

**Wyróżnienie wśród aplikacji AI:** efekt „wow” ma pokazać prawdziwą wygodę produktu, nie wymyślone możliwości. Czysty montaż, duże napisy, rzeczywiste działanie funkcji i czytelny wynik mają przekonać bardziej niż ogólny komunikat „AI robi wszystko”.

## 2. Ustalone fakty o ofercie

Źródłem jest lokalny kod z 30.09.2026. To potwierdzenie katalogu w repozytorium; nie jest potwierdzeniem bieżących ustawień sklepów, kont reklamowych ani każdej funkcji produkcyjnej.

| Oferta | Fakt z aktualnego kodu | Konsekwencja dla reklamy |
| --- | --- | --- |
| Darmowy B2C | Do 3 ulubionych posiłków; generator standardowy; ręczna dieta i PDF; 10 analiz zdjęć/miesiąc | „Wypróbuj za darmo” z jasno podanym limitem ulubionych; nie obiecujemy wszystkich funkcji bezpłatnie |
| Premium B2C w przeglądarce | 10 zł za 1 miesiąc; 25 zł za 3 miesiące; 90 zł za 12 miesięcy, kwoty brutto | Cena 7,50 zł/mies. jest równowartością przy płatności 90 zł za rok, nie osobną miesięczną ofertą |
| Ulubione w Premium | Bez limitu | Korzyść: własna biblioteka częściej używanych posiłków; dostępne nagranie musi pokazać rzeczywisty zapis i ponowne użycie |
| Darmowy specjalista | Do 2 aktywnych klientów, bez limitu czasu, bez płatności i karty | Nie komunikujemy fikcyjnego 7- lub 14-dniowego trialu |
| Starter | 49 zł za 1 miesiąc, do 30 aktywnych klientów | Główny segment: praktyka, która potrzebuje prowadzić co najmniej 3 klientów |
| Pro | 99 zł za 1 miesiąc, do 100 aktywnych klientów | Uzasadnienie dopłaty: większy limit, nie wyłączność podstawowych narzędzi |
| Studio | 199 zł za 1 miesiąc, do 300 aktywnych klientów | Nie zakładamy gotowych funkcji wielu stanowisk tylko na podstawie nazwy Studio |
| Okresy B2B | 3 miesiące: 5% rabatu; 12 miesięcy: 10% rabatu, płatność za cały okres z góry | Pokazać cenę łączną i okres; nie obiecywać automatycznego odnowienia |
| Funkcje specjalisty | Diety, treningi, szablony, PDF, publikacja w aplikacji, gabinet i czat w każdym planie | Główną historią jest przepływ pracy. Nie rozbijamy tych narzędzi na fikcyjne pakiety |
| Plan od specjalisty | Nie wymaga osobistego Premium klienta | Zaproszony klient zwiększa użycie produktu, ale nie jest automatycznie nowym płatnikiem B2C |
| Integracje | Home opisuje import ukończonych treningów Polar; Apple Zdrowie i Health Connect jako przygotowywane | Nie reklamujemy przygotowywanych integracji jako dostępnych |

Źródła lokalne: `health-app-frontend/src/features/subscriptions/model/subscription.ts`, `health-app-frontend/src/pages/Home.tsx`, `health-app-frontend/src/components/marketing/TrainerPlans.tsx`, `health-app-frontend/src/pages/TrainerPricing.tsx`. Aktualny audyt produktu, ścieżki zapisu i pochodzenie ujęć: [produkt-fakty.md](../qa/produkt-fakty.md). Kanoniczna domena kampanii to **diecik.com**. Przed emisją sprawdzić zgodność dostępnej wersji aplikacji i docelowej oferty.

Publiczne karty potwierdzono 30.09.2026 w audycie pakietu: [App Store](https://apps.apple.com/pl/app/diecik-dieta-i-trening/id6762611821), przez [Apple iTunes lookup](https://itunes.apple.com/lookup?id=6762611821&country=pl), oraz [Google Play](https://play.google.com/store/apps/details?id=com.helti.app&hl=pl&gl=PL). Potwierdza to karty Diecika, a nie każdą najnowszą lokalną funkcję, cenę sklepową lub instalację na wszystkich urządzeniach. „Ulubione” jest nowym tematem kampanii; daty premiery samej funkcji nie ustalono, więc nie oznaczamy jej jako właśnie wydanej nowości.

## 3. Konkurencja: co faktycznie trzeba przebić

| Marka | Potwierdzone komunikaty i funkcje | Wniosek dla Diecika |
| --- | --- | --- |
| Fitatu | Ulubione ułatwiają ponowne dodawanie; Premium+AI oferuje zdjęcie, głos i opis posiłku | Ani „ulubione”, ani „AI ze zdjęcia” nie są same w sobie unikalne. Pokaż prosty rytuał w Dieciku i rzeczywistą jakość obsługi |
| YAZIO | AI analizuje zdjęcie posiłku, pozwala poprawić składniki i porcje; oferta PRO | Nie wygrywamy samym hasłem o AI. Budujemy zaufanie kontrolą użytkownika i jasno pokazaną funkcją |
| Kcalmar.pro | Jadłospisy, baza produktów, PDF i aplikacja pacjenta; Basic 67,65 zł brutto za miesiąc według bieżącego cennika | „Plan w telefonie pacjenta” jest wartościową historią, ale nie wyłączną funkcją Diecika. Sprzedaj uporządkowaną współpracę; dieta i trening to potwierdzony zakres produktu, choć film 20 s pokazuje przygotowanie diety |
| Aliant | Edycja diet i dokumentacja, PDF, konto pacjenta; PRO 492 zł brutto/6 miesięcy, licencja bezterminowa 2458,77 zł | Nie obiecujemy przewagi klinicznej ani zastąpienia całego warsztatu dietetyka. Pokaż codzienny proces, darmowy start i swoją konkretną ofertę |

Porównanie cen nie oznacza równoważnego zakresu funkcji. Strony konkurentów są materiałem opisowym, nie niezależnym dowodem ich skuteczności. Brak funkcji na sprawdzonej stronie nie dowodzi jej braku w produkcie.

Źródła: [Fitatu: dodawanie i ulubione](https://www.fitatu.com/pl/help/jak-dodac-produkt-lub-potrawe-do-jadlospisu), [Fitatu: funkcje AI](https://www.fitatu.com/pl/help/jakie-funkcje-ai-oferuje-aplikacja-fitatu), [YAZIO: AI i edycja wyniku](https://help.yazio.com/hc/en-us/articles/39137901903889-What-is-the-AI-Calorie-Tracking-Feature-and-how-does-it-work), [Kcalmar: cennik i aplikacja pacjenta](https://kcalmar.com/dietetyk/cennik/), [Aliant: licencje](https://aliant.com.pl/sklep/). Weryfikacja: 30.09.2026.

## 4. Kanały i kolejność

| Kanał | Rola w pierwszych 30 dniach | Decyzja |
| --- | --- | --- |
| Google Search B2B | Dotarcie do osób aktywnie szukających programu dla dietetyka/trenera | Priorytet płatny; frazy precyzyjne, B2B landing, jakość zgłoszeń i płatnicy |
| Meta B2B | Krótkie demo procesu, zainteresowanie panelem i prezentacją | Drugi kanał płatny; pojedynczy proces, oddzielna kampania |
| Meta B2C | Sprawdzenie historii ulubionych posiłków i kosztu aktywacji | Mały, limitowany test; nie skalujemy samych kliknięć lub instalacji |
| Instagram/Facebook organic | Dowód jakości produktu, krótkie demonstracje i spójność profilu | Od pierwszego tygodnia; 3 wartościowe publikacje tygodniowo |
| YouTube Shorts/TikTok organic | Ta sama funkcja z początkiem i tempem dopasowanym do kanału | Test wtórny bez rozdrabniania budżetu płatnego; sprawdzamy utrzymanie uwagi |
| Partnerstwa ze specjalistami | Specjalista używa panelu, a jego klienci odbierają realne plany | Priorytet pozareklamowy; rozmowy i demonstracje dopiero po odrębnej zgodzie na kontakt |
| Google App Campaigns | Automatyczna reklama instalacyjna w wielu sieciach Google | Drugi etap: działający pomiar, gotowa karta sklepu i budżet na naukę |
| LinkedIn Ads | Płatne dotarcie do specjalistów | Odłożyć do potwierdzenia popytu; nie zakładamy niższego CAC ani wystarczającego wolumenu PL |
| SEO | Przykłady zastosowania: ulubione posiłki, program dla dietetyka, dieta i trening klienta | Praca równoległa; nie traktować jako źródła gwarantowanych wyników w 30 dni |
| PMax / szeroki Display / płatny TikTok | Duży zasięg przy słabszej kontroli małego testu | Na razie odłożyć; wrócić po sprawdzeniu konwersji i materiałów |

Google zaleca przy App Campaigns z docelowym CPI średni budżet dzienny co najmniej 50 razy tCPI, a dla działań w aplikacji 10-15 razy tCPA. To zalecenia dla pracy algorytmu, nie gwarancja wyników ani formalny próg publikacji. Przykładowe tCPI 2 zł oznacza około 100 zł dziennie dla jednej kampanii, bez potwierdzenia, że takie CPI jest opłacalne dla Diecika. Nie rozdzielamy więc małej próby na Meta, Google App, iOS i Android jednocześnie. [Google: konfiguracja App Campaigns](https://support.google.com/google-ads/answer/6167156?hl=en-EN).

## 5. Odbiorcy i ścieżka do wyniku

### B2C: własna biblioteka posiłków

Główna hipoteza: osoba, która ma kilka powtarzających się posiłków, szybciej zrozumie korzyść ponownego użycia niż szeroką obietnicę „aplikacji AI”. Reklama nie przypisuje widzowi wagi, choroby ani problemów z wyglądem.

**Ścieżka:** reklama z zapisem i użyciem ulubionego → strona lub prawidłowa karta sklepu → rejestracja → pierwszy zapis → ponowne dodanie w innym dniu → powrót po 7 dniach → ewentualny zakup Premium.

Trzy ulubione są pełnoprawnym darmowym startem. Nie wymuszamy zakupu już przed pierwszym skorzystaniem z obiecanej funkcji. Wariant Premium komunikuje „ulubione bez limitu”, z ceną właściwą dla miejsca zakupu.

Pierwszy test: Polska, osoby pełnoletnie, język polski, jedna szeroka grupa bez budowania segmentów według zdrowia. Zawężenie wieku jest hipotezą dopiero po wynikach, nie założeniem o „idealnym” kliencie.

### B2B: praktyka od 3 aktywnych klientów

Główna hipoteza: specjalista, który musi już organizować pracę kilku klientów, ma konkretny powód do zakupu. Student lub początkujący może długo pozostać na darmowym planie; nie mylimy liczby darmowych kont z przychodem.

**Ścieżka:** zapytanie Google lub demo Meta → `/specjalista` → darmowy start albo formularz prezentacji → pierwszy klient i plan → publikacja do aplikacji → trzeci aktywny klient / płatny plan → rzeczywiste kolejne płatne okresy.

Kwalifikowane zgłoszenie: osoba działa lub zamierza działać jako dietetyk/trener w Polsce, planuje co najmniej 3 aktywnych klientów, podała kontakt i zainteresowanie prezentacją/panelem. Formularz nie zbiera danych pacjentów, chorób ani opisów leczenia. Obsługa odpowiada w uzgodnionym dniu roboczym, kwalifikuje kontakt i zapisuje rezultat.

Przepływ publikacji planu jest potwierdzony w produkcie. Film w tym pakiecie łączy panel ze źródła 29.09 z ujęciem innego klienta native z 30.09, dlatego widok telefonu ma oznaczenie „DEMO · osobny przykład klienta”. Nie opisujemy montażu jako nagrania jednego powiązanego planu. Gdy kolejny materiał ma dokumentować jedną konkretną publikację i jej odbiór, nagrane konto DEMO, opublikowany plan i konto odbiorcy muszą być faktycznie połączone.

## 6. Konfiguracja kampanii do przygotowania

Nazwy w tej sekcji są wzorcem. Import i szczegółowe nazwy znajdują się w osobnym pakiecie operacyjnym. Wszystkie kampanie pozostają wstrzymane przed zatwierdzonym uruchomieniem.

### Google Search: specjalista

- Kampania: `PL_B2B_Search_Program_30d`; Polska, obecność w Polsce; język polski; sieć wyszukiwania Google.
- Na początku bez Display i partnerów wyszukiwania, żeby czytelnie ocenić próbę; to wybór testu, nie twierdzenie, że te sieci są zawsze nieskuteczne.
- Dwie grupy: program dla dietetyka oraz program dla trenera. Frazy ścisłe i do wyrażenia, np. „program dla dietetyka”, „program do układania jadłospisów”, „aplikacja dla trenera personalnego”. Dopasowania nadal mogą obejmować zbliżone zapytania: regularnie przeglądamy raport haseł.
- Wykluczenia konsumenckie i nietrafione: dieta 1500 kcal, darmowy jadłospis, catering, pudełkowa, praca, kurs, studia, dieta na chorobę. Nie wykluczamy całego słowa „darmowy”, ponieważ darmowy plan jest realną ofertą.
- Konkurentów nie dodajemy w pierwszym teście: osobna ewentualna decyzja po sprawdzeniu popytu i zasad znaków towarowych.
- Landing B2B: `https://diecik.com/specjalista`; cennik: `/specjalista/cennik`; darmowy start: `/specjalista/start`. Sprawdzić na produkcji zgodność, odpowiedź HTTP i drogę po CTA przed emisją.
- Główna konwersja po wdrożeniu pomiaru: rzeczywiście przyjęte zgłoszenie, potem jego kwalifikacja i zakup. Kliknięcie CTA lub otwarcie formularza to diagnostyka, nie płatny klient.
- Jeśli brak pomiaru: krótki, osobno limitowany test haseł na kliknięcia może ocenić popyt, ale nie udaje testu CAC. Nie włączamy automatycznej optymalizacji konwersji bez działającego zdarzenia.

RSA: maksymalnie 15 nagłówków po 30 znaków i 4 opisy po 90 znaków. Teksty muszą mieć sens w różnych zestawieniach; aktualne limity i teksty zweryfikować przed importem. [Google: elastyczne reklamy w wyszukiwarce](https://support.google.com/google-ads/answer/7684791?LanguageId=1&hl=en).

### Meta: specjalista

- Kampania oddzielna od B2C. Film 20 s pokazuje panel i status publikacji ze źródła 29.09 oraz osobny przykład aplikacji klienta z 30.09. Oznaczenie dwóch kont DEMO musi być spójne w obrazie, napisach i manifeście; CTA dopasowane do formularza albo darmowego startu.
- Pierwsza opcja: cel potencjalnych klientów i formularz natywny, jeżeli konto udostępnia odpowiedni wariant formularza, a odbiór kontaktów jest gotowy. Krótkie pytanie o rolę i zakres liczby aktywnych klientów pozwala sprawdzać jakość zgłoszeń.
- Druga opcja: zgłoszenie na stronie, gdy działa pomiar i formularz rzeczywiście zapisuje lead. Nie wyświetlamy podziękowania za dane, których backend nie przyjął.
- Polska, pełnoletni, bez segmentów związanych ze stanem zdrowia. Nie zakładamy, że istnieją i działają konkretne zainteresowania lub tytuły zawodowe w panelu; ich dostępność weryfikujemy przy konfiguracji.
- Reels/Stories: pionowy film z audio; Feed: dedykowany kadr 4:5. Podglądy placementów decydują o czytelności napisów i CTA.
- Jedna grupa i 2 odmienne początki filmu na start: A „Od planu do telefonu klienta.”, B „Plan gotowy. Klient ma go pod ręką.”. Reszta montażu i CTA identyczna. Porównujemy filmy w tym samym placemencie, grafiki testujemy później.

### Meta: ulubione posiłki

- Wariant A: „Twój smak. Twój skrót.”; komunikat wspierający „Zapisz raz. Dodawaj ponownie.”.
- Wariant B: „Lubisz ten posiłek?”; w copy „Zapisz go na kolejny raz.”. Film B zmienia wyłącznie pierwsze 2,2 s; pozostały montaż jest taki sam.
- Oba filmy 15 s mają proporcje 9:16 i 4:5. Domyślnie porównujemy film A i film B w tym samym placemencie; zgodne formatem grafiki A/B są kolejnym, osobnym testem.
- Wspólne CTA: „Wypróbuj za darmo”. Na planszy końcowej lub w copy: „Do 3 ulubionych w planie darmowym”; zakres Premium można dopowiedzieć jako „bez limitu”. Porównanie filmów w jednakowym formacie izoluje zmianę hooka w kreacji. Nierówny przydział wyświetleń przez platformę nadal ogranicza ocenę wyniku; małej próby nie przedstawiamy jako istotnego statystycznie eksperymentu.
- Kampania instalacyjna dopiero po sprawdzeniu aplikacji w koncie, dostępności sklepu i pomiaru instalacji/dalszych działań. Na małym budżecie wybieramy jeden system z potwierdzoną ścieżką.
- Jeśli gotowa jest ścieżka web i neutralny pomiar, badamy rejestracje. Jeżeli dostępny jest tylko pomiar wizyt strony, ograniczony wariant LPV bada ruch i kreację, a wynik nie jest nazywany CPA zakupu ani CPI.
- Bez działającej ścieżki i pomiaru rezerwa B2C pozostaje niewydana. Pliki kreatywne mogą być gotowe, mimo że kampania pozostaje wstrzymana.

## 7. Budżet testu: rekomendowane 3000 zł na media

Kwoty to limity testowe na 30 dni od startu, nie aktualna zgoda na wydatki. Produkcja materiałów, VAT/opodatkowanie faktur reklamowych, obsługa zgłoszeń, wsparcie i ewentualne wynagrodzenie twórców wymagają osobnego ujęcia w koszcie marketingu.

| Wariant | Google Search B2B | Meta B2B | Meta B2C | Jak użyć |
| --- | ---: | ---: | ---: | --- |
| Ostrożny: 1500 zł | 1000 zł | 500 zł | 0 zł | Jeden główny segment płatny, B2C organic; budżet służy rozpoznaniu popytu |
| Rekomendowany: 3000 zł | 1500 zł | 1000 zł | 500 zł | B2B ma pierwszeństwo; B2C to mały test ulubionych i aktywacji |
| Rozwinięty: 6000 zł | 3000 zł | 2000 zł | 1000 zł | Dopiero gdy pomiar, obsługa i pierwsze wyniki uzasadniają wydatki; nie uruchamiać automatycznie |

**Preferowany Google Search:** nowa kampania z budżetem łącznym 1500 zł i datami 30-dniowego testu. Aktualna dokumentacja Google potwierdza budżet łączny dla nowych kampanii Search, także z Manual CPC, Maximize Clicks i Maximize Conversions, na okres 3-90 dni. Google nie naliczy więcej niż ustawiony budżet łączny; pojedynczy dzień nie ma takiego samego limitu jak model średniego budżetu. Typu budżetu nie można zmienić po utworzeniu kampanii. [Google: budżety łączne kampanii](https://support.google.com/google-ads/answer/10486938?hl=en).

**Alternatywa w imporcie Editor:** średni budżet około 49,34 zł dziennie przy mnożniku 30,4. Nie łączyć go z instrukcją budżetu łącznego i nie tworzyć obu kampanii. Przy średnim budżecie Google może w większości kampanii wydać pojedynczego dnia do dwukrotności średniej; miesięczny mechanizm nie jest precyzyjnym limitem dowolnego 30-dniowego testu lub próby obejmującej dwa miesiące. Jeśli konto nie oferuje modelu łącznego, ustawić daty, kontrolować sumę i wstrzymać po przydziale. [Google: średnie budżety i limity](https://support.google.com/google-ads/answer/6385083?hl=en).

Meta: preferowany budżet na ustalony okres 1000 zł B2B i 500 zł B2C, jeśli taka opcja jest dostępna dla wybranego typu kampanii; w przeciwnym razie dzienne limity z kontrolą sumy i datą końcową. Nie zakładać, że każdy cel ma identyczny interfejs lub dostępne ograniczenia.

Przenosimy niewydaną rezerwę B2C wyłącznie po świadomej decyzji o zmianie testu. Nie zwiększamy wydatków po samym wzroście zasięgu czy tanich leadach.

## 8. Ile można zapłacić za klienta

**Liczymy koszt płacącego klienta i marżę po kosztach. Przychód brutto oraz ROAS w panelu nie są zyskiem.**

Model scenariuszowy:

`kontrybucja = cena brutto / (1 + VAT) - prowizje - zwroty - koszt obsługi i infrastruktury`

`CAC break-even = suma rzeczywistych kontrybucji zakupów klienta - przypisane koszty darmowych użytkowników i wdrożenia`

`CAC docelowy = wybrany udział CAC break-even; w przykładzie 50%`

`CPL docelowy = CAC docelowy × odsetek kwalifikowanych leadów, które stają się płatnikami`

Założenia do poniższego przykładu: VAT 23%; prowizje 3% ceny brutto; zwroty 2% ceny brutto; B2C koszt zmienny 1 zł za miesiąc dostępu; B2B koszt zmienny 15 zł miesięcznie dla każdego planu. Wspólny koszt B2B upraszcza scenariusz i pozwala zachować spójność z arkuszem kampanii; nie dowodzi równych kosztów obsługi każdego planu. Wszystkie te stawki są hipotetyczne. Nie zawierają kosztów stałych, pracy właściciela, pozyskania partnerów, darmowych kont i wszystkich ewentualnych kosztów AI. Zastąpić je rzeczywistym zestawieniem przed skalowaniem.

### B2C: pierwsza płatność w przeglądarce

| Plan | Przychód brutto | Przykładowa kontrybucja przed kosztami darmowych kont | Roboczy CAC docelowy: 50% kontrybucji |
| --- | ---: | ---: | ---: |
| 1 miesiąc | 10,00 zł | 6,63 zł | 3,32 zł |
| 3 miesiące | 25,00 zł | 16,08 zł | 8,04 zł |
| 12 miesięcy | 90,00 zł | 56,67 zł | 28,34 zł |

Przykład mieszanki, **nie obserwacja**: 50% zakupów miesięcznych, 30% kwartalnych, 20% rocznych daje około 19,48 zł kontrybucji z pierwszych zakupów i roboczy CAC 9,74 zł. Gdy tylko 5% pozyskanych użytkowników zostaje płatnikami, pierwsza płatność uzasadnia około 0,97 zł kosztu pozyskanego użytkownika do break-even albo około 0,49 zł przy celu 50%. Koszty darmowych użytkowników obniżają te wartości.

To pokazuje, dlaczego tanie instalacje nie wystarczą. Przy 500 zł na B2C mierzymy przede wszystkim zrozumienie historii i aktywację ulubionych. Opłacalność masowej reklamy pozostaje hipotezą. Dla zakupów App Store/Google Play użyć rzeczywistego wpływu netto po prowizji sklepu i podatkach; nie przenosić modelu opłat web na sklepy.

### B2B: liczba faktycznie opłaconych okresów

| Plan miesięczny | Kontrybucja jednego okresu | Break-even przy 3 płatnych okresach | Break-even przy 6 płatnych okresach | Roboczy CAC: 50% wariantu 6 okresów |
| --- | ---: | ---: | ---: | ---: |
| Starter 49 zł | 22,39 zł | 67,16 zł | 134,32 zł | 67,16 zł |
| Pro 99 zł | 60,54 zł | 181,61 zł | 363,23 zł | 181,61 zł |
| Studio 199 zł | 136,84 zł | 410,52 zł | 821,03 zł | 410,52 zł |

Trzy i sześć zakupów to osobne założenia, nie potwierdzony czas utrzymania klienta. Zakupy web nie odnawiają się automatycznie. Nie wolno zakładać sześciu płatności tylko dlatego, że użytkownik zarejestrował konto.

Przy hipotetycznym Pro i 10% konwersji kwalifikowanych leadów na płatny plan roboczy CPL wynosi około 18,16 zł. Przy 5% jest to 9,08 zł; przy 20% 36,32 zł. Jeśli dominują klienci Starter, limit trzeba obniżyć. Koszt prezentacji, wdrożenia i utrzymania darmowych specjalistów odejmujemy dodatkowo. Budżet 2500 zł B2B przy roboczym CAC około 182 zł wymaga około 14 płatnych klientów; to wymaganie ekonomiczne, nie prognoza wyniku.

## 9. Plan 30 dni

| Okres | Konkretne działania | Warunek przejścia dalej |
| --- | --- | --- |
| Przed dniem 1 | Test funkcji ulubionych; nagranie aktualnego UI; sprawdzenie drogi po CTA; działający formularz B2B; audyt pomiaru; konta DEMO; podglądy placementów | Prawdziwa funkcja, zgodna oferta i jednoznaczne konwersje; kampanie nadal wstrzymane do zatwierdzenia |
| Dni 1-3 | Start Search B2B i Meta B2B po zgodzie; 2 hooki B2B; 2 hooki ulubionych tylko przy gotowej ścieżce; kontrola jakości odbieranych zgłoszeń | Brak błędów strony, zapisu leadów i linków; koszty mieszczą się w limitach |
| Dni 4-7 | Sprawdzenie haseł Search, wykluczenie nietrafionych; przejrzenie rozmów i formularzy; publikacja 3 materiałów organicznych | Wiemy, które zgłoszenia są od specjalistów i czy docierają do pierwszego użycia |
| Dni 8-14 | Porównanie filmów A/B w tym samym placemencie i formacie; weryfikacja obietnicy ulubionych; obserwacja aktywacji i powrotów; minimum zmian jednocześnie | Odróżniamy problem hooka, landing page, onboardingu i oferty; grafiki są osobnym dalszym testem |
| Dni 15-21 | Nowy wariant początku zwycięskiego kierunku; ewentualna demonstracja z prawdziwym specjalistą po uzyskaniu praw do wizerunku i materiału | Wynik oceniany przez jakość i klientów, nie samą oglądalność |
| Dni 22-30 | Ocena dojrzałych kohort, płatności i kosztów; decyzja o utrzymaniu, poprawie lub zatrzymaniu kanału; bez automatycznego zwiększenia budżetu | Wynik ma źródło, koszty są policzone, a konwersje nie są dublowane |
| Po 30 dniach | Domknięcie późnych zakupów i ewentualnych zwrotów; aktualizacja CAC i miksu planów | Ostateczny raport osobno od szybkiego raportu dnia 30 |

Google App Campaigns po istotnych zmianach może wymagać 7-14 dni stabilizacji. Nie przenosimy tego jako gwarancji dla wszystkich innych kampanii. [Google: okres nauki w App Campaigns](https://support.google.com/google-ads/answer/6167156?hl=en-EN).

### Reguły podejmowania decyzji

1. Błąd zakupu, formularza, linku albo pomiaru: wstrzymaj objęty problemem ruch do poprawienia ścieżki.
2. B2B: oceń udział kwalifikowanych leadów, aktywacji oraz płatników; odrzuć kierunek przy utrwalonym niskim dopasowaniu, nawet gdy CPL jest tani.
3. Brak płatnika po wydaniu około dwukrotności roboczego CAC: ręcznie sprawdź, czy konwersje miały już czas dojrzeć i czy działają. To sygnał do pauzy/zmiany, nie test istotności statystycznej.
4. Za sygnał do małego zwiększenia budżetu przyjmij co najmniej 10 dojrzałych płatnych klientów w analizowanej kohorcie, działający pomiar i CAC mieszczący się w policzonym limicie. Dziesięć klientów nie dowodzi powtarzalności w większej skali.
5. B2C: 500 zł jest maksymalnym kosztem ograniczonej próby. Gdy brak aktywacji ulubionych lub pomiaru dalszej ścieżki, nie zwiększaj budżetu mimo wysokiego CTR.
6. Budżet zwiększaj małymi krokami, np. 15-20% co kilka dni, tylko gdy jakość i ekonomia się utrzymują. Ten zakres jest praktyczną regułą testu, nie polityką platform ani gwarancją utrzymania CAC.

## 10. Pomiar bez danych o zdrowiu w reklamie

**Ustalenie z kodu:** istniejący `googleAdsConfig.ts` ładuje AdSense (`adsbygoogle.js`), a baner zgód wspiera ten kontekst. Sama jego obecność nie potwierdza GA4, Google Ads Conversion Tracking, Meta Pixel ani pomiaru instalacji. W przeszukanych plikach aplikacji i pakietów nie potwierdzono wdrożonego kompletnego pomiaru kampanii. Nie przeprowadzono audytu paneli produkcyjnych.

| Etap | Mierzymy wewnętrznie | Co można rozważyć po audycie do narzędzia reklamowego |
| --- | --- | --- |
| B2C | Rejestracja; zapis ulubionego; ponowne użycie; powrót 7 dni; zakup i zwrot | Neutralne rejestracja/zakup, jeżeli zgodne z klasyfikacją źródła danych, politykami i zgodą |
| B2B | Przyjęte zgłoszenie; kwalifikacja; aktywacja panelu; pierwszy plan; płatny plan; kolejne zakupy | Neutralne lead/zakup, jeśli ich użycie jest dozwolone i potwierdzone |
| Kreacja | Wyświetlenia, utrzymanie uwagi, kliknięcia, wejścia na stronę | Dane dostępne w panelu; nie zastępują końcowego CAC |

Treść posiłków, kalorie, makro, masa ciała, wywiad, choroba, dane klienta, zdjęcia posiłków i wiadomości pozostają poza payloadem reklamowym i UTM. Sama neutralna nazwa eventu nie naprawia wrażliwego kontekstu jego wyzwolenia. W szczególności zdarzenia zapisania posiłku albo stworzenia planu nie są automatycznie wysyłane do Meta/Google.

UTM: źródło `meta`/`google`, medium `paid_social`/`cpc`, kampania z segmentem, content z hookiem i formatem; bez informacji o pacjencie lub jego stanie. Sprawdzić zachowanie UTM przez logowanie i przejście do sklepu; nie zakładać automatycznie atrybucji zakupu aplikacji do kliknięcia w landing.

Jeden zakup liczymy jeden raz, po rzeczywistym potwierdzeniu płatności. W raportach: osobno atrybucja panelu, last click z własnych źródeł, zakupy, opóźnienia i zwroty. Nie sumujemy bezkrytycznie klientów raportowanych przez Meta i Google.

W EOG Google wymaga właściwego zbierania i przekazywania zgód dla pomiaru/reklam. Sprawdzić między innymi `ad_user_data` i `ad_personalization` oraz działanie przy odmowie i cofnięciu zgody. Zgoda marketingowa nie znosi zakazu przesyłania danych wrażliwych. [Google: zgody w EOG](https://support.google.com/google-ads/answer/13695607?hl=en).

## 11. Zasady reklam i ograniczenia zdrowotne

### Meta

Komunikacja opisuje funkcję i wygodę: „Zapisz posiłek”, „Dieta i trening w jednym miejscu”, „Publikuj plan w aplikacji klienta”. Nie używamy zdań typu „Masz nadwagę?”, „Cierpisz na cukrzycę?”, zawstydzania wyglądem, sylwetek przed/po, obietnic utraty kilogramów ani medycznej skuteczności. Nie generujemy fikcyjnych opinii lub ludzi sugerujących autentycznych użytkowników produktu.

Przyjmujemy odbiorców 18+ jako ostrożną regułę tego testu. Nie deklarujemy specjalnej kategorii reklam „health” tylko na podstawie branży; konfigurację i ewentualną kategorię źródła danych sprawdza się na konkretnym koncie.

**Zakres weryfikacji:** odczytany oficjalny materiał Meta Blueprint opisuje odrzucenie komunikacji wywołującej negatywną ocenę wyglądu w celu sprzedaży oferty zdrowotnej i zawiera odnośnik do polityki osobistych cech. Jej szczegółowej aktualnej treści nie udało się odczytać: bezpośrednie strony polityk Meta zwróciły 429 lub wymaganie logowania. Komunikację opartą na funkcji i brak przypisywania widzowi stanu zdrowia przyjmujemy jako ostrożną regułę tego pakietu. Przed emisją należy sprawdzić aktualne wymagania na koncie; nie twierdzimy, że ten plan jest pełnym audytem aktualnego regulaminu.

Źródła: [Meta: Privacy Violations and Personal Attributes](https://transparency.meta.com/policies/ad-standards/objectionable-content/privacy-violations-personal-attributes/), [Meta: Health and Wellness](https://transparency.meta.com/policies/ad-standards/restricted-goods-services/health-wellness/), [Meta Blueprint: standardy reklam](https://storage.googleapis.com/understanding_meta_advertising_standards/Understanding_Meta_Advertising_Standards.pdf). Pierwsze dwa linki wskazują docelowe źródła do sprawdzenia; pełny odczyt ich bieżącej treści był niedostępny.

### Google

Zasady personalizacji ograniczają wykorzystywanie informacji o stanie zdrowia. Nie oznacza to automatycznie zakazu reklam zwykłego planowania posiłków lub programu biznesowego dla dietetyka. Jednak reklama, landing i cały produkt mogą wpływać na klasyfikację. Treści o chorobach i ich prowadzeniu mogą należeć do kategorii wrażliwej; dla niej listy własnych odbiorców, Customer Match i segmenty danych są ograniczone.

Na start wybieramy Search z intencją zakupu programu, bez remarketingu do użytkowników na podstawie zdrowia lub danych z aplikacji. Google opublikował także doprecyzowanie dotyczące treści kierowanych do profesjonalistów w ich roli zawodowej; to nie jest zgoda na kierowanie reklam według stanu zdrowia ich pacjentów. [Google: ograniczenia personalizacji](https://support.google.com/adspolicy/answer/143465?hl=en), [zdrowie w reklamach spersonalizowanych](https://support.google.com/adspolicy/answer/16701855?hl=en), [doprecyzowanie B2B z maja 2025](https://support.google.com/adspolicy/answer/16258024?hl=en).

## 12. Brief materiałów: jakość, którą można sprawdzić

### B2C: ulubione, 15 sekund

| Czas | Obraz z produktu | Tekst |
| --- | --- | --- |
| 0-2,2 s | Zdjęcie posiłku i główny hook A | „Twój smak. Twój skrót.” |
| 2,2-5,6 s | Rzeczywista akcja zapisania posiłku w aplikacji | „1. Zapisz posiłek.” |
| 5,6-9,8 s | Biblioteka ulubionych i wybór zapisanej pozycji | „2. Wybierz z ulubionych.” |
| 9,8-12 s | Ponowne dodanie i rezultat we własnej diecie | „3. Dodaj ponownie.” |
| 12-15 s | Logo i czytelna plansza końcowa | „Zapisz raz. Dodawaj ponownie.”, „Wypróbuj za darmo”, limit 3, diecik.com |

Wariant B „Lubisz ten posiłek?” zmienia wyłącznie pierwsze 2,2 s filmu; dalsze sceny, CTA i długość pozostają identyczne. Pliki A: `meta/b2c-ulubione-15s-1080x1920.mp4` i `meta/b2c-ulubione-15s-1080x1350.mp4`; pliki B: `meta/b2c-ulubione-hook-b-15s-1080x1920.mp4` i `meta/b2c-ulubione-hook-b-15s-1080x1350.mp4`. Grafiki A/B również mają zgodne formaty i służą osobnej, późniejszej próbie.

Animacja oprawy nie zastępuje dowodu funkcji. Nie obiecujemy dodawania „jednym kliknięciem” ani „w 2 sekundy”, jeśli nagranie pokazuje więcej kroków. Opis daty i pochodzenia zdjęcia oraz aktualnych ujęć należy odczytać z manifestu pakietu.

### B2B: panel i osobny przykład klienta, 20 sekund

| Czas | Obraz i pochodzenie | Tekst / warunek |
| --- | --- | --- |
| 0-2,2 s | Hook i oprawa marki | „Od planu do telefonu klienta.” |
| 2,2-7,2 s | Rzeczywiste planowanie diety w panelu, źródło z 29.09 | „Przygotuj plan diety.”; widoczne posiłki, porcje i wartości odżywcze |
| 7,2-10,6 s | Prawdziwy status opublikowanego planu w panelu ze źródła 29.09 | „Opublikuj w aplikacji.”; nie pokazujemy fikcyjnego potwierdzenia |
| 10,6-16 s | Świeży widok planu native z 30.09; inny klient niż w źródle web | „Plan pod ręką klienta.” + „DEMO · osobny przykład klienta” |
| 16-20 s | Plansza końcowa | „Zacznij bezpłatnie.”, „Do 2 aktywnych klientów. Bez karty.”, diecik.com/specjalista |

Film pokazuje dwa przykłady kont DEMO i nie dokumentuje przekazania jednego planu między nimi. Ogólną możliwość publikacji potwierdza produkt; konkretny montaż wymaga widocznego rozdzielenia przykładów. Pochodzenie panelu, świeży native i dokładne zakresy źródeł muszą być zapisane w manifeście.

Pionowy wariant B rozpoczyna się tekstem „Plan gotowy. Klient ma go pod ręką.”; zmienia tylko pierwsze 2,2 s. Pozostałe sceny, oznaczenie osobnego przykładu klienta DEMO i CTA pozostają takie same. Najpierw porównujemy dwa filmy w tym samym placemencie, potem osobno grafiki.

### Format i montaż

- Master pionowy 1080×1920; osobny kadr Feed 1080×1350 lub wyższa rozdzielczość o proporcji 4:5; kwadrat do zastosowań, które go potrzebują. To założenia produkcyjne pakietu, nie pełna lista wymagań każdego placementu.
- Meta Reels: pionowy obraz, audio i kluczowe treści w bezpiecznej strefie potwierdza oficjalna rekomendacja Meta. Finalny podgląd na koncie musi sprawdzić aktualne nakładki. [Meta: Reels](https://www.facebook.com/business/ads/facebook-instagram-reels-ads).
- Maksymalnie jedna obietnica na scenę. Duża, krótka typografia; spokojny kadr UI przy kliknięciu; logo z rzeczywistego pliku marki. Błędy, loading i prywatne dane nie trafiają do kadru jako przypadkowy element.
- Bez syntetycznego lektora. Napisy i obraz przekazują całą historię po wyciszeniu. Muzyka oraz efekty wymagają potwierdzonych praw dla docelowego kanału.
- Licencja Meta Sound Collection lub TikTok CML nie daje automatycznie prawa do uniwersalnego użycia na innych platformach. Jeden czysty master obrazu plus warianty audio zgodne z licencją.
- Oprawa blue/green z logo, jasne powierzchnie, czytelny kontrast; nie zakładamy nowej zatwierdzonej palety ani obcych stockowych interfejsów.
- Google App (etap 2): obrazy JPG/PNG do 5 MB, zalecane 1200×628, 1200×1200, 1200×1500; wideo hostowane na YouTube. Lokalny MP4 jest materiałem do uploadu, nie gotowym URL kampanii. [Google: specyfikacja App Campaigns](https://support.google.com/google-ads/answer/17091671?hl=en), [typy zasobów](https://support.google.com/google-ads/answer/9948381?hl=en-419).

## 13. Co organicznie robić przez miesiąc

Trzy publikacje tygodniowo, jeden konkretny efekt w każdej. Gotowe propozycje tematów:

| Tydzień | B2C | B2B | Dowód / wyjaśnienie |
| --- | --- | --- | --- |
| 1 | Zapis posiłku do ulubionych | Plan w panelu i telefonie klienta | Co jest darmowe i jakie są limity |
| 2 | Ponowne dodanie ulubionego w innym dniu | Edycja planu przed publikacją | Rzeczywista kontrola nad planem |
| 3 | Trzy ulubione na codzienny rytm | Dieta i trening jednego klienta | Krótka odpowiedź na pytanie o PDF / aplikację |
| 4 | Biblioteka ulubionych i Premium bez limitu | Darmowy start do 2 klientów | Najlepszy realny przykład miesiąca |

Każdy temat można dopasować do Reels, Stories, karuzeli lub Shorts, ale nie wgrywamy identycznego pliku z watermarkiem na wszystkie platformy. Preferujemy konkretne mini-demonstracje zamiast genericznych „5 porad AI”. Wyniki organiczne pomagają wybierać hooki, lecz nie dowodzą, że reklama przyniesie sprzedaż.

Partnerstwa: przygotować listę 10 dobrze dopasowanych specjalistów, demo panelu i wspólną propozycję wdrożenia. Nie zakładać kodów rabatowych/afiliacji bez istniejącego mechanizmu. Nie wysyłać wiadomości ani ofert w tym etapie; kontakt wymaga osobnej instrukcji. Wynagrodzenie i atrybucja muszą uwzględniać rzeczywisty płatny plan, nie samą liczbę klientów zaproszonych do aplikacji.

## 14. Lista odbioru i raport wyniku

- [x] Oddzielono B2C od B2B i wybrano główną historię ulubionych dla B2C: A „Twój smak. Twój skrót.”, B „Lubisz ten posiłek?”.
- [x] Ceny, limity i brak ograniczonego trialu sprawdzono w lokalnym kodzie.
- [x] Zweryfikowano, że konkurenci komunikują ulubione / AI; brak twierdzeń o wyłączności.
- [x] Przygotowano scenariusze budżetu i policzono przykładową ekonomię.
- [x] Odnotowano ograniczenia dostępu do bieżących polityk Meta.
- [ ] Potwierdzono runtime ulubionych i zapis → ponowne użycie na bieżącej wersji aplikacji.
- [ ] Finalne materiały mają sprawdzone ujęcia, daty źródeł i status DEMO; B2B oznacza osobny przykład klienta, bez sugerowania powiązania aktorów web i native.
- [ ] Podgląd każdej kreacji i audio przechodzi QA właściwego kanału.
- [ ] Landing, rejestracja, formularz i droga do zakupu działają na wersji docelowej.
- [ ] Pomiar i zgody sprawdzono na rzeczywistym koncie, bez przesyłania zdrowia do reklam.
- [ ] Bartosz zatwierdził uruchomienie konkretnego zestawu kampanii i limit wydatków tuż przed akcją.

Otwarte pola dotyczą wykonania i uruchomienia całego pakietu, nie brakujących rozdziałów strategii. Status nagrań, eksportów i konfiguracji kampanii należy odczytać z manifestu całego pakietu.

Raport dnia 30: wydatki na segment/kanał, kwalifikowane zgłoszenia, aktywacje, płatnicy i ich plany, rzeczywisty wpływ netto, zwroty, koszty obsługi, CAC, powroty i liczba ponownych użyć ulubionych. Dodać obserwację opóźnień zakupów oraz informację, które kohorty nie mają jeszcze pełnego okresu obserwacji. Końcowa decyzja: utrzymać, poprawić konkretny etap lub zatrzymać; każda ma wskazane dane.

**Rezultat strategii:** konkretny 30-dniowy test, gotowe kierunki kreacji i warunki uruchomienia. Najważniejsza niewiadoma to opłacalność pozyskania płatnika przy obecnej cenie B2C i brak potwierdzonej retencji B2B. Reklama ma tę niewiadomą mierzyć, a nie ukrywać.
