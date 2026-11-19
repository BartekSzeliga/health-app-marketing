# Diecik — v6, 01.10.2026

Zacznij od [specjalisty lead A — 30 s, pionowy](filmy/diecik-specjalista-lead-a-30s-story.mp4).
Pełny panel pozostaje nieruchomy. Duży opis dokładnej czynności jest połączony linią z prawdziwym
przyciskiem; kursor i sygnał kliknięcia wskazują moment reakcji aplikacji. Etykieta akcji ma 60 px
w Story, czyli 20 px przy podglądzie filmu o szerokości 360 px. Kamera nie powiększa fragmentów UI.

Edytor trwa 0–8,5 s: „Zobacz kolejne posiłki” objaśnia rzeczywiste zwinięcie sekcji śniadania przy 6,766667 s.
Główne „Opublikuj w aplikacji” zajmuje 8,5–12 s, pełny modal 12–16,5 s, a wynik 16,5–19,5 s.
Przed każdą akcją jest ponad 2 s orientacji; czysty rezultat pozostaje przez 3 s. Cały telefon klienta
jest widoczny 19,5–30 s, z naturalnym scrollem 1× w 21,5–25,2 s i CTA od 27,8 s nad tą samą ramą.
Harmonogram ma status FROZEN po wewnętrznym odbiorze zakodowanego hero przez root i marketing_strategy.

A zaczyna „Układasz dietę. Klient ma ją w aplikacji.”, B „Dieta od Ciebie. W aplikacji klienta.”
Lead kończy „Zobacz, jak to działa”; website „Zacznij bezpłatnie”. Pięć B2B ma 30 s:
A/B lead 9:16, A/B website 9:16 oraz website A 16:9. [Config v6](kampanie/meta-konfiguracja-v6-PAUSED.json)
i [instrukcja](kampanie/instrukcja-v6.txt) podają aktualne przypisania. Wide/short są dodatkami bez nowej puli budżetu.

[B2C A — 20 s](filmy/diecik-ulubione-a-20s-story.mp4) pozostaje wcześniej zaakceptowanym materiałem.
Pięć filmów B2C i 12 plików audio zachowuje oryginalne bajty. B2B ma nowy własny master DSP
30 s / 96 BPM / 12 taktów: `audio/diecik-specjalista-v6-mix-30s.wav`; zawiera muzykę, przejścia i trzy efekty UI.
Nie dodawaj stemów drugi raz do gotowego mastera. Pochodzenie: [audio/LICENSES.md](audio/LICENSES.md).

Autentyczne UI, daty i wartości są zachowane; zewnętrzne etykiety DEMO/example pozostają wyłączone.
[Noty źródłowe](qa/b2b/source-review.md) dokumentują różne konta/pakiety. Copy opisuje funkcję produktu.
Wewnętrzne odbiory poprzednich B2B nie oznaczają akceptacji użytkownika; nie deklarujemy akceptacji v5 ani v6.
Bieżący odbiór obrazu jest w `qa/b2b-render/`, a audio 30 s w `qa/audio/specialist-audio-validation.json`.
Historyczny `qa/audio/audio-validation.json` dotyczy zachowanego B2C v3 i ma dawne pola `b2b_preserved`.

Budżet pozostaje propozycją 3000 zł/30 dni: Search B2B 1500, Meta B2B 1000, Meta B2C 500 warunkowo.
Lead i website B2B są alternatywami tej samej puli. Lokalny config pozostaje PAUSED z ID null;
nie utworzono reklam na kontach i nie wydano pieniędzy. JSON to ręczna specyfikacja, nie payload API.
PDF/MD planu, XLSX oraz sześć CSV Google Search są zachowane bajtowo. B2C copy: 3 ulubione za darmo,
Premium bez limitu, film bez stopki limitowej. B2B: do 2 aktywnych klientów bez opłat.

`filmy/`, `okladki/`, `kampanie/` i `plan/` to materiały do użycia; źródła są w `assets/` i `audio/`.
