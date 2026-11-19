# Diecik — v5, 01.10.2026

Zacznij od [specjalisty lead A — 25 s, pionowy](filmy/diecik-specjalista-lead-a-25s-story.mp4).
Jedna korzyść: **układasz dietę w panelu, klient ma plan pod ręką w aplikacji**.
Trzy pełne sceny pokazują rzeczywistą pracę w edytorze, publikację i korzystanie z planu na telefonie.
Okna pozostają nieruchome; nie ma makrodetali, zoomów ani przelotów. Ruch telefonu to prawdziwy scroll 1×.
Zamrożony harmonogram: edytor 0–8,5 s, publikacja 8,5–15,3 s, pełny telefon 15,3–25 s.
Końcowe CTA od 22,8 s pozostawia cały telefon w tej samej ramie.

A zaczyna „Układasz dietę. Klient ma ją w aplikacji.”, B „Dieta od Ciebie. W aplikacji klienta.”
Lead kończy „Zobacz, jak to działa”; website „Zacznij bezpłatnie”.
Pięć filmów B2B po 25 s: A/B lead 9:16, A/B website 9:16 i website A 16:9.
[Config v5](kampanie/meta-konfiguracja-v5-PAUSED.json) i [instrukcja](kampanie/instrukcja-v5.txt)
podają aktualne przypisania. Short B2C/wide B2B to dodatki bez nowej puli budżetu.

[B2C A — 20 s](filmy/diecik-ulubione-a-20s-story.mp4) pozostaje wcześniej zaakceptowanym materiałem.
Pięć B2C MP4 i 12 plików audio zachowuje te same bajty; nie są renderowane ponownie.
B2B ponownie korzysta z mastera 25 s z v4, stąd rzeczywiste nazwy audio zawierają v4.

Zewnętrzne etykiety DEMO/example są wyłączone; autentyczne UI pozostaje.
[Noty źródłowe](qa/b2b/source-review.md) opisują różne zapisane konta/pakiety.
Copy prezentuje ogólną funkcję produktu. Poprzedni wewnętrzny PASS v4 nie był akceptacją użytkownika.
Nowy harmonogram v5 zamrożono po wewnętrznym odbiorze hero przez root i marketing_strategy.
Metadane bieżącego odbioru są w `qa/b2b-render/`; nie deklarują akceptacji nowego B2B przez użytkownika.

Budżet pozostaje propozycją 3000 zł/30 dni: Search B2B 1500, Meta B2B 1000, Meta B2C 500 warunkowo.
Lead i website B2B to alternatywy tej samej puli. Konfiguracja jest lokalna PAUSED, ID null;
nie utworzono reklam na kontach i nie wydano pieniędzy. JSON jest specem ręcznym, nie payloadem API.
Plan PDF/MD, XLSX i 6 CSV Google Search zachowują oryginalne bajty. B2C copy: 3 ulubione za darmo,
Premium bez limitu; finał bez stopki limitowej. B2B: do 2 aktywnych klientów bez opłat.

`filmy/`, `okladki/`, `kampanie/` i `plan/` to materiały do użycia; źródła są w `assets/` i `audio/`.
Historyczny `qa/audio/audio-validation.json` opisuje zachowany B2C v3; jego `b2b_preserved` to ówczesne B2B.
Audio specjalisty 25 s opisuje `qa/audio/specialist-audio-validation.json`. Nazwa v4 oznacza ponowne użycie
niezmienionego mastera, a nie stary montaż filmu. Pochodzenie: [audio/LICENSES.md](audio/LICENSES.md).
