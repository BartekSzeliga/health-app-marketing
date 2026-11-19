Diecik — dietetyk i trener personalny — v8 — 2026-10-01

DWA FILMY
1. filmy/diecik-dietetyk-panel-20s-story.mp4
   Poprawiona zaakceptowana koncepcja „Dieta nie kończy się w gabinecie”.
   Pierwsza osoba ma rzeczywisty panel specjalisty na ekranie laptopa.
   Nowe ujęcie telefonu w kuchni; casting i otoczenie dopasowane wizualnie
   do polskiej kampanii. Zachowana muzyka, tempo i pozostała opowieść v7.
2. filmy/diecik-trener-personalny-20s-story.mp4
   Osobna reklama „Twoje wsparcie także między treningami”. Rzeczywisty
   panel treningowy, trening z klientem oraz autentyczna lista ćwiczeń
   w telefonie. Wspólna oprawa marki, odrębny przekaz i treść treningowa.

Każdy: 20 s, 1080×1920, 30 fps, H.264, AAC stereo 48 kHz, pion 9:16.
Okładki w okladki/. Teksty reklamy do obu zastosowań w kampanie/.
Aktualne zakodowane kadry 360 px w podglad/storyboard-{dietetyk,trener}-360.jpg.
W tej korekcie powstały dwa różne spoty, bez mnożenia wariantów każdego filmu.

PANEL W LAPTOPIE
Pełne oryginalne screenshoty są kompozytowane w płaszczyźnie fizycznego
ekranu. Cztery krawędzie są śledzone; dłoń, rękaw i obudowa pozostają
przed ekranem. UI nie zostało przepisane lub podmienione. Napis filmu
przeniesiono wyżej, aby nie zasłaniał laptopa. To ilustracja użycia produktu,
nie potwierdzona sesja widocznej modelki ani instrukcja klikania.
Szczegóły: qa/panel-composite/composite-review.json.

PRAWDZIWOŚĆ TELEFONÓW
Dietetyk: autentyczny opublikowany plan „Od specjalisty”, Joanna/Pakiet 5,
bajtowo identyczny ze źródłem v7. Nie deklarujemy przekazania tego pakietu
z konta widocznego w panelu na laptopie.
Trener: autentyczny, wypełniony ekran „Moje treningi”; pokazuje ćwiczenia,
serie i powtórzenia. Zakładki i treści nie podmieniano. Ten kadr nie jest
capture otrzymania planu od trenera. Przekaz w tej scenie opisuje zawartość
ćwiczeń w Dieciku. Możliwość opublikowania planu do aplikacji klienta
potwierdzono osobno w produkcie; nie twierdzimy, że model zrealizował
trening z tego screenshotu. Źródła funkcji: qa/product-truth.txt.

UŻYCIE I ŹRÓDŁA
Stock przedstawia ilustracje pracy, jedzenia i ćwiczeń. Modele nie są
pokazani jako prawdziwi klienci lub rekomendujący Diecik. Casting wybrano
po widocznych cechach wyglądu i wnętrzu; nie przypisano aktorom narodowości,
pochodzenia lub kwalifikacji na podstawie zdjęć. Ujęcia nie udowadniają
wyników zdrowotnych, kontroli wykonania planu ani oszczędności godzin.
Źródła nowych klipów/autorzy/licencje/SHA: assets/footage/sources.json
oraz credits.txt; wykorzystane i wcześniejsze źródła: assets/provenance.json.
Licencja publicznych klipów: https://www.pexels.com/license/
Muzyka: własny zaakceptowany podkład v7, kopia bajtowo identyczna;
audio/LICENSE.txt dokumentuje autorstwo i użycie w obu spotach.

Kuchenny klip ma 6,6 s; normalny odcinek i rozmyte tło produktu częściowo
korzystają z tego samego zakresu źródła. Nie przyspieszano go ani nie
wydłużano sztucznie nieruchomym zdjęciem. Gym pokazuje tę samą parę
z jednego ciągłego klipu; zachowano obie osoby i gest asekuracji w szerszym
ostrym obrazie na filmowym rozmytym tle, zamiast przypadkowego ucięcia.

WERYFIKACJA I PAKIET
qa/verification-{dietetyk,trener}.json zawierają aktualne hashe i wyniki
pełnego dekodowania obraz/dźwięk. qa/creative-review.txt opisuje odbiór
kadrów i jego granice; nie stanowi pomiaru skuteczności ani akceptacji
użytkownika. Surowe samodzielne stockowe MP4 nie są dołączane do ZIP;
pakiet zawiera gotowe dwie reklamy, okładki, teksty i dokumentację źródeł.

Produkcja lokalna: production/edit-*.json, prepare-footage.mjs,
render-film.mjs, review-film.mjs, composite-panel.py.
Poprzednie materiały i aplikacja zachowane. Bez publikacji, zmian kont,
wydatków, commita/pushu lub wdrożenia produkcji.
