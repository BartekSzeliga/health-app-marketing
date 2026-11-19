---
name: reklama
description: Przygotowuje paczkę reklam, grafik, film lub post Diecik narzędziem ./reklama — od researchu przez ujęcia do gotowej paczki z podglądem dla Bartosza. Użyj, gdy Bartosz prosi o reklamę, grafikę, karuzelę, film Reels/Stories, post albo materiał dla specjalistów lub firmy.
---

# Nowa reklama Diecik

Pracujesz w repo `health-app-marketing`. Zasady są w `AGENTS.md` i `zasady/`; poniżej sama kolejność.
Bartosz nie chce pytań o kierunek: przygotuj się, zdecyduj, pokaż gotowe, na końcu wypisz odrzucone opcje.

1. **Research.** Biblioteka reklam Meta (facebook.com/ads/library, kraj Polska): co do tej samej grupy emituje konkurencja —
   hasła, wygląd, oferta. Ceny konkurencji. Aktualna strona docelowa i jej dokładne sformułowania. Zapisz, czym nasza reklama
   ma się odróżnić.
2. **Ustal zlecenie.** Odbiorca, jedna funkcja lub oferta, kanał i umiejscowienie, CTA. Pytaj tylko o to, czego nie da się ustalić samemu.
3. **Załóż kampanię:** `./reklama nowa <nazwa> --typ instalacje|specjalista|firma|post` i uzupełnij `BRIEF.md`.
4. **Sprawdź produkt w kodzie:** co funkcja robi, co jest darmowe, ile kosztuje, czego nie obiecamy. Wpisz `dowody` i `uwagi`.
5. **Źródła:** ekrany produktu z aktualnego buildu na koncie demo (`zasady/zrodla-i-dane-demo.md`); do reklam dla specjalistów
   i firm także nagrania ludzi z pexels.com do `zrodla/material/` (obejrzyj tło każdego klipu).
6. **Uzupełnij `kampania.json`.** Nagłówek mówi wprost, co odbiorca dostaje — zrozumiale dla laika, bez pytań-zagadek
   (`zasady/komunikacja.md`). Kilka naprawdę różnych koncepcji, nie warianty jednej. Wzory:
   `narzedzie/przyklady/wzorzec-instalacje` (paczka instalacji), `kampanie/2026-11-19-prowadzenie-i-aplikacja`
   (zdjęcie na tle, cena, film z nagrań, kadr 4:5). Kadry: `./reklama kadr`.
7. **`./reklama sprawdz`** do zera błędów, **`./reklama szkic`**, własna ocena i poprawki: twarze bez napisów, czytelność
   w rozmiarze telefonu, czy widać ofertę w pierwszej sekundzie.
8. **`./reklama buduj`**, obejrzyj każdy plik w pełnej rozdzielczości oraz `qa/film/*-kontakt.jpg` (pion i 4:5).
   Grafiki i filmy trafiają same do `DO_OBEJRZENIA/` — tam Bartosz sprawdza pracę.
9. **Przekaż Bartoszowi:** że pliki są w `DO_OBEJRZENIA/`, co jest w paczce, co sprawdziło narzędzie, czego nie sprawdziłeś (odsłuch muzyki, podgląd umiejscowień
   w Menedżerze reklam), co budzi Twoją wątpliwość i **jakie opcje rozważyłeś i odrzuciłeś**.
10. **Po jego decyzji:** `./reklama akceptuj <kampania> --cytat "…"` albo `./reklama odrzuc <kampania> --powod "…"`.
    Wgranie i publikacja to osobna zgoda.

Nie pisz własnych rendererów (brakujący układ dodaj do narzędzia z testem), nie retuszuj ekranów, nie commituj,
nie wgrywaj niczego bez wyraźnego polecenia. Po każdej poprawce Bartosza dopisz lekcję do `zasady/lekcje.md`.
