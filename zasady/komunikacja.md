# Komunikacja: co wolno powiedzieć

Źródła: brand guide, `qa/claims-review.md` z paczki 18.10.2026, `ZRODLA.txt` z 21.10.2026 i lekcje z poprawek.
Reguły, które da się sprawdzić mechanicznie, pilnuje `./reklama sprawdz` (`narzedzie/reguly/tresci.json`).

## O czym mówimy

Planowanie, personalizacja, organizacja, kontrola celów, oszczędność czasu, wsparcie regularności.
Przekaz dotyczy tego, co użytkownik zaplanuje i zapisze, nie tego, co osiągnie.

## Nagłówek zrozumiały dla laika

- Nagłówek mówi wprost, co odbiorca dostaje i po co: korzyść + produkt. Wzór podany przez Bartosza (19.11.2026):
  „Buduj markę z własną aplikacją”.
- Test: osoba, która nie zna Diecika i widzi sam nagłówek przez sekundę, wie, o czym jest reklama.
- Nie używamy pytań-zagadek, gier słów ani haseł zrozumiałych dopiero po obejrzeniu reszty („Czyje logo widzi Twój podopieczny?” — zastąpione).
- Napisy pod nagłówkiem i w filmie trzymają ten sam ton: krótkie zdania oznajmujące o tym, co dostajesz
  („Z Twoją nazwą i logo.”, „Podopiecznych prowadzisz w panelu.”).
- Odbiorcę nazywamy etykietą nad nagłówkiem („Dla dietetyków”, „Dla trenerów”), a nie wołaczem wplecionym w hasło.

## Czego nie obiecujemy

| Nie piszemy | Dlaczego |
|---|---|
| gwarancji efektu, utraty masy, tempa chudnięcia | aplikacja proponuje cel i plan; wyniku nie kontrolujemy |
| leczenia, diagnozy, oceny niedoborów | Diecik nie jest wyrobem medycznym; podsumowanie planu to nie badanie |
| „najlepsza aplikacja”, „nr 1”, liczby użytkowników, opinii | bez źródła, które da się pokazać, to twierdzenie nie do obrony |
| „przed i po”, zawstydzania wyglądem lub masą | zasada marki i reguły platform reklamowych |
| czasu działania i liczby kliknięć | montaż pomija oczekiwanie, więc film nie dowodzi czasu |
| dokładnego dopasowania liczb | pokazane wartości to przykład; np. cel 1902 kcal i jadłospis 1842 kcal |
| pozyskania klientów, przychodu, przewagi nad konkurencją (specjaliści, firmy) | szersza oferta to pozycjonowanie, nie obietnica wyniku |
| wyniku kampanii reklamowej | paczka nie zawiera obietnicy niższego kosztu pozyskania |

## Dowód dla każdego twierdzenia

- Każde twierdzenie o produkcie w kampanii ma wpis w `dowody`: co twierdzimy i który plik w repo produktu to potwierdza.
  `./reklama sprawdz` zatrzyma budowanie, jeśli wskazany plik nie istnieje.
- Dowodem jest aktualny kod i aktualny ekran, nie pamięć ani starsza paczka. Kontrola kodu nie ustala,
  od kiedy funkcja jest w sklepie — przy nowej funkcji potwierdź wersję w App Store i Google Play.
- Ekran musi dowodzić dokładnie tej obietnicy, którą niesie plansza. Własny trening użytkownika nie dowodzi
  planu od specjalisty; pusty widok „Brak treningów” nie dowodzi niczego.
- Opis źródła w dokumentach nie naprawia mylącego obrazu. Jeśli widz zrozumie z kadru coś innego, niż jest prawdą, zmień kadr.

## Darmowe a płatne

- Słowa „za darmo”, „bezpłatnie” wolno użyć tylko dla funkcji, której bezpłatność potwierdza kod.
  Narzędzie zgłasza uwagę, dopóki kampania nie ma dowodu o bezpłatności.
- Stan z 21.10.2026 (sprawdź ponownie przed użyciem): generator diety Standard jest darmowy; pozostałe typy diet,
  lista zakupów, kopiowanie dnia i tygodnia oraz nielimitowane ulubione wymagają Premium; w planie darmowym są 3 ulubione posiłki.
- „Zacznij za darmo” oznacza plan darmowy z ograniczeniami, nie okres próbny.
- **Premium do własnej diety i płatny plan specjalisty to osobne produkty.** Nie używamy tych nazw zamiennie.
- Informacji o ofercie nie dopisujemy drobnym drukiem na planszy. Albo oferta jest tematem reklamy i cena stoi jako duży,
  czytelny element (`cena` w kampanii — decyzja Bartosza z 19.11.2026 dla „od 600 zł miesięcznie”), albo zostaje w tekście reklamy.
- Cenę przepisujemy ze strony docelowej co do słowa, razem z „brutto” lub „netto”. Opłaty dodatkowe ze strony (np. konta sklepów)
  wymieniamy w `uwagi` kampanii.

## Dane przykładowe

- Kreacje pokazują konta demonstracyjne. Informacja „Dane przykładowe” stoi na planszy poza interfejsem aplikacji.
- Liczby z ekranu (kalorie, makro, kwoty) nie trafiają do obietnicy. W tekście mówimy „propozycja kalorii”, nie „1902 kcal”.
- Zakres dat z przykładu nie może brzmieć jak limit produktu: w nagłówku „plan diety”, nie „7 dni”.
- Cel kalorii dla redukcji to propozycja z szacowanego zapotrzebowania i wybranej korekty, nie pomiar deficytu.
- Mikroskładniki są sumowane z danych produktów; brak wartości w bazie nie oznacza niedoboru u osoby.

## Teksty do wklejenia

- Jeden temat = komplet pól: tekst główny, krótki wariant, nagłówek, opis. Narzędzie generuje `TEKSTY-REKLAM.txt` z licznikami znaków.
- Zalecane długości Meta są w `zasady/specyfikacje.md`; dłuższy tekst główny zwija się pod „więcej”, więc sens musi być w pierwszym zdaniu.
- Krótki wariant jest alternatywą dla tekstu głównego, nie dopiskiem do niego.
- CTA na planszy i przycisk reklamy mówią to samo. Dla instalacji: „Pobierz Diecik” i „Zainstaluj teraz”;
  dla specjalistów: „Dowiedz się więcej” i `diecik.com/specjalista`.
- Adres sklepu dobieramy do systemu odbiorcy. W kampanii instalacji adres strony głównej nie zastępuje adresu sklepu.
- Gotową wiadomość lub tekst do skopiowania podajemy zwykłym tekstem, bez znaków cytatu.

## Aplikacja mobilna a zakupy

W materiałach kierujących do aplikacji ze sklepu nie dajemy linków ani wezwań do zakupu Premium na stronie WWW.
Płatne funkcje cyfrowe w aplikacji sklepowej idą przez App Store i Google Play.
