# Diecik — pakiet v4, 01.10.2026

Zacznij od [NOWEGO spotu specjalisty lead A — 25 s, pionowy](filmy/diecik-specjalista-lead-a-25s-story.mp4).
Ma spokojniejszy rytm: pełny panel, czytelny edytor i publikacja, pełny ekran telefonu,
rzeczywiste przewijanie i finał z CTA. Zewnętrzne etykiety DEMO i numery przykładów usunięto
na żądanie użytkownika; autentyczne UI pozostaje bez zmian.

[B2C A — Jeszcze raz?, 20 s](filmy/diecik-ulubione-a-20s-story.mp4) został zaakceptowany.
Pięć filmów B2C oraz ich audio przeniesiono z v3 bez zmiany bajtów. Nie renderuje się ich ponownie.
B2C zachowuje warianty A/B 20 s w 9:16 i 4:5 oraz short A 10 s.

- **Lead B2B:** [A 25 s](filmy/diecik-specjalista-lead-a-25s-story.mp4) / [B 25 s](filmy/diecik-specjalista-lead-b-25s-story.mp4), 9:16, CTA „Zobacz, jak to działa” do formularza prezentacji.
- **Website B2B:** [A 25 s](filmy/diecik-specjalista-website-a-25s-story.mp4) / [B 25 s](filmy/diecik-specjalista-website-b-25s-story.mp4), 9:16, CTA „Zacznij bezpłatnie”. [Wide A 25 s](filmy/diecik-specjalista-website-a-25s-wide.mp4) ma 16:9.
- **Dodatki:** short B2C i wide B2B są opcjonalne, bez dodatkowej kampanii lub puli budżetu. Okładki hook służą filmom; Search nie wymaga wideo.

Harmonogram specjalisty: hook 0–3 s, pełny panel 3–5 s, edytor 5–9 s,
publikacja 9–12,7 s, wynik 12,7–14,7 s, pełny telefon 15,3–17,3 s,
prawdziwy scroll 17,3–21,0 s, pełny telefon po scrollu 21,0–22,8 s, CTA 22,8–25 s.
Noty o kontach i pakietach zapisano wyłącznie w [dokumentacji źródeł](qa/b2b/source-review.md).
Copy przedstawia ogólne funkcje panelu i aplikacji; nie twierdzi, że pokazano przekazanie
tego samego konkretnego planu między tymi samymi kontami.

[Config Meta v4](kampanie/meta-konfiguracja-v4-PAUSED.json) i [instrukcja](kampanie/instrukcja-v4.txt)
mają aktualne pliki. Konfiguracja pozostaje lokalna: PAUSED, ID konta null;
nie utworzono reklam na kontach ani nie wydano budżetu. JSON jest specem ręcznym, nie payloadem API.

Plan 3000 zł/30 dni pozostaje propozycją: Search B2B 1500 zł, Meta B2B 1000 zł,
Meta B2C 500 zł warunkowo. Lead i website B2B korzystają alternatywnie z tej samej puli.
Plan PDF/MD, XLSX i sześć CSV Google Search zachowują oryginalne bajty i historyczne kalkulacje;
bieżące media przypisuj z config v4. Oferta B2C w copy: 3 ulubione za darmo, Premium bez limitu.
Finał B2C pozostaje bez stopki limitowej. Oferta B2B: do 2 aktywnych klientów bez opłat.

`filmy/` zawiera media, `okladki/` kadry hook/CTA, `kampanie/` copy i lokalne konfiguracje,
`plan/` bazę finansową, a `assets/`, `audio/`, `production/` źródła do edycji.
Muzyka pochodzi z własnej syntezy; [audio/LICENSES.md](audio/LICENSES.md) opisuje jej pochodzenie.
Zdjęcie B2C pochodzi z przepisu; [prompt wycięcia](assets/imagegen-prompts.json) zapisano w `assets/`.
Opis pakietu nie jest deklaracją odsłuchu ani akceptacji nowego B2B. Odbiór finalnych renderów znajduje się w `qa/`.

Nota QA audio: `qa/audio/audio-validation.json` jest historycznym raportem zaakceptowanego
B2C z v3; zachowane 12 plików mają te same SHA. Jego pola `b2b_preserved` dotyczą
ówczesnego B2B v3, a nie nowego spotu v4. Raport bieżącego audio B2B 25 s to
[qa/audio/specialist-audio-validation.json](qa/audio/specialist-audio-validation.json).
Odbiór pięciu nowych filmów B2B i ich SHA zapisują `qa/b2b-render/creative-final-review.json`
oraz `qa/b2b-render/technical-validation.json`.
