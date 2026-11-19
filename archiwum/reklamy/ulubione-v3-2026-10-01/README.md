# Diecik — reklamy v3, 01.10.2026

Główny spot: [Jeszcze raz? — 20 s, pionowy](filmy/diecik-ulubione-a-20s-story.mp4).
Spokojniejszy montaż pokazuje pełny ekran aplikacji przed detalem oraz rezultat
ponownego dodania posiłku w kolejnym dniu. Finał ma CTA bez dolnej stopki o limicie.

- `filmy/`: A/B 20 s w 9:16 i 4:5, short 10 s oraz pięć filmów B2B 15 s.
- `okladki/`: JPG z bieżących filmów; osobno hook i kadr CTA.
- `kampanie/`: [ręczny config Meta v3](kampanie/meta-konfiguracja-v3-PAUSED.json), teksty do wklejenia oraz sześć CSV Google Search.
- `plan/`: zachowane bajtowo PDF/MD analizy i XLSX budżetu/KPI z 30.09.2026.
- `assets/`, `audio/`, `production/`: źródła i montaż; `qa/`: odbiór kreacji, źródeł i eksportu.

B2C A „Jeszcze raz?” i B „Lubisz ten smak?” różnią się hookiem do 1.42 s;
body po 1.42 s ma być identyczne. Oferta pozostaje w tekście reklamy i spec:
3 ulubione posiłki za darmo, Premium bez limitu. W filmie usunięto stopkę z tym limitem.
B2B: do 2 aktywnych klientów bez opłat. Web i mobile to osobne przykładowe konta DEMO.

Dodatki: [short 10 s](filmy/diecik-ulubione-a-10s-story.mp4) i
[website wide 15 s](filmy/diecik-specjalista-website-a-15s-wide.mp4) są opcjonalne,
bez dodatkowego budżetu. Okładki hook służą filmom; Search nie wymaga wideo.

Plan 3000 zł/30 dni pozostaje propozycją: Search B2B 1500 zł, Meta B2B 1000 zł,
Meta B2C 500 zł warunkowo. Lead i website B2B korzystają alternatywnie z tej samej puli.
Arkusz i plan zachowują wcześniejsze kalkulacje oraz historyczne opisy kreacji.
Aktualne pliki i przypisania są wyłącznie w [instrukcji v3](kampanie/instrukcja-v3.txt)
i config v3. [Kontrola kopii](qa/copied-plan-validation.json) porównuje je z oryginałami.

UI jest autentyczne. Fotografia pochodzi z przepisu; wycięcie tła wykonał wbudowany
ImageGen, [prompt](assets/imagegen-prompts.json) i oryginał są w `assets/`.
Muzyka pochodzi z własnej syntezy; [audio/LICENSES.md](audio/LICENSES.md) opisuje pochodzenie.

Konfiguracja jest lokalna: PAUSED, ID konta null. Nie utworzono kampanii na kontach
ani nie wydano budżetu. JSON jest specyfikacją ręczną, nie payloadem Marketing API.
Wyniki kampanii pozostają puste do rzeczywistego pomiaru.
