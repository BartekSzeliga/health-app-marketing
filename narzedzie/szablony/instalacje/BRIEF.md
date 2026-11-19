# Brief — paczka instalacji B2C

Uzupełnij przed zrobieniem ujęć. Jedno zdanie na punkt wystarczy.

## Ustalenia

- **Funkcja, którą promujemy** (jedna na temat):
- **Dla kogo** i w jakiej sytuacji jej potrzebuje:
- **Obietnica jednym zdaniem** (co użytkownik będzie miał, nie co kliknie):
- **Co jest darmowe, a co wymaga Premium** w tej funkcji (z kodu, nie z pamięci):
- **Czego nie obiecujemy** (czas, efekt, dopasowanie co do liczby):
- **Gdzie trafi reklama** (Feed, Reels, Stories) i do której kampanii:

## Ujęcia do zrobienia

Na koncie demonstracyjnym, w aktualnym buildzie, natywnym zrzutem i nagraniem ekranu.
Pliki wgraj do `zrodla/ekrany/` i `zrodla/nagrania/` bez żadnej obróbki.

- [ ] ekran, na którym widać funkcję w całości (`ekran-glowny.png`)
- [ ] ekran z rezultatem działania (`ekran-wynik.png`)
- [ ] nagranie prawdziwej czynności od dotknięcia do rezultatu (`przeplyw.mp4`)
- [ ] dane demo wyglądają sprzedażowo: prawdziwe zdjęcia posiłków, wartości mieszczą się w celach (bez czerwonych pasków)

## Kolejność pracy

1. Popraw `kampania.json`: teksty, kadry (`./reklama kadr <kampania> <źródło>`), dowody twierdzeń.
2. `./reklama sprawdz` — do zera błędów.
3. `./reklama szkic` — obejrzyj planszę 360 px i storyboard; oceń jak ktoś, kto widzi aplikację pierwszy raz.
4. Pokaż Bartoszowi kierunek na jednym temacie, zanim rozbudujesz kampanię o kolejne.
5. `./reklama buduj`, obejrzyj plansze z zakodowanych filmów, potem `./reklama pokaz`.

Zasady, których szkic nie sprawdzi za Ciebie: `zasady/kreacja.md`.
