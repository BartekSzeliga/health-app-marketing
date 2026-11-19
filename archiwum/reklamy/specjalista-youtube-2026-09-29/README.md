# Diecik dla specjalistów — film do YouTube

Gotowy film do wgrania na YouTube i późniejszego osadzenia na `diecik.com/specjalista`. Materiał nie został opublikowany ani podmieniony na stronie.

## Pliki

| Plik | Zastosowanie |
| --- | --- |
| `output/diecik-specjalista-youtube-2026-09-29.mp4` | Główny film poziomy 1920×1080, 30 kl./s, H.264/AAC, ok. 4:23. Wideo ma widoczne polskie napisy. |
| `output/diecik-specjalista-miniatura.jpg` | Miniatura YouTube 1280×720. |
| `output/diecik-specjalista-napisy-pl.srt` | Edytowalny zapis polskich napisów. Napisy są już widoczne w MP4; włączenie tej ścieżki w odtwarzaczu nałoży drugi tekst. |
| `output/diecik-widok-klienta-iphone-demo-2026-09-29.mp4` | Osobny pionowy klip klienta 1080×1920, ok. 26,7 s. Zaczyna się od pełnego dnia planu specjalisty. |
| `output/manifest.json` | Dokładne przedziały źródeł oraz sumy SHA-256. |

## Co pokazuje film

Zachowano oryginalne nagranie panelu w całości i w kolejności źródłowej. Wycięto tylko przypadkowe karty przeglądarki od **3:39,6 do 3:44,0** źródła. Karty zaczynają się ok. 0,4 s przed wskazanym 3:40. Przy rezerwacji online około **1:40** widać automatyczne tworzenie linku Google Meet, co opisuje osobny napis. Samo wpisywanie odpowiedzi na czacie przyspieszono **4×**; kliknięcie „wyślij” i potwierdzenie są w normalnym tempie. Widoczny na końcu źródła pasek systemowego nagrywania zakryto fragmentem czystej klatki tego samego ujęcia, bez skracania sceny.

Część mobilna pochodzi z nowego nagrania bieżącej aplikacji na symulatorze iPhone 17. Pierwszy kadr pokazuje naraz pięć różnych posiłków dnia **29 września 2026** w zakładce **„Od specjalisty”**: owsiankę, jabłko ze skyrem, penne, kefir i tortillę. Ten kadr jest składanką rzeczywistych przewinięć jednego dnia w aplikacji, dzięki czemu cały plan mieści się na ekranie. Następnie film pokazuje prawdziwe nagranie tego samego dnia: przewinięcie posiłków, przepis, składniki i kolejny dzień. Nie pokazuje zawartości „Moja dieta”. Z oprawy usunięto tekst „na iPhone” oraz cały blok „Przykładowy pakiet DEMO”. Wszystkie konta w dostarczonym nagraniu są fikcyjne, co potwierdził Bartosz.

Plansza końcowa pokazuje adres `diecik.com/specjalista` i kontakt do umówienia prezentacji: `kontakt@diecik.com`.

## Wgranie na YouTube

1. Wgraj `output/diecik-specjalista-youtube-2026-09-29.mp4`.
2. Dodaj miniaturę `output/diecik-specjalista-miniatura.jpg`.
3. Po przetworzeniu obejrzyj szczególnie przyspieszony czat około **3:40–3:51** i pierwszy kadr aplikacji około **3:52**.
4. Prześlij link do filmu, aby przygotować podmianę osadzenia na `/specjalista`.

Proponowany tytuł:

> Diecik dla specjalistów | Pełny pokaz panelu i aplikacji klienta

Proponowany opis do wklejenia:

```text
Zobacz, jak Diecik wspiera codzienną pracę dietetyka i trenera — od zarządzania klientami i wizytami, przez przygotowanie 7-dniowej diety, aż po publikację planu w aplikacji mobilnej.

W materiale pokazujemy:

- panel specjalisty i listę klientów,
- gabinet, terminy i rezerwacje,
- kartę klienta z wizytami, pomiarami i wywiadem,
- publiczny profil specjalisty i automatyczne tworzenie linku Google Meet do wizyty online,
- szablony diet i wybór przepisów,
- tworzenie pakietu, wczytanie szablonu diety oraz kontrolę posiłków, składników i makro,
- publikację planu i czat z klientem,
- widok „Od specjalisty” w aplikacji klienta: cały dzień pięciu posiłków, przepis, składniki i kolejny dzień.

Chcesz zobaczyć pełne możliwości Diecika? Zostaw pytanie w komentarzu albo umów krótką prezentację, pisząc na kontakt@diecik.com.
Więcej informacji: https://diecik.com/specjalista

Rozdziały:

00:00 Panel specjalisty
00:24 Lista klientów
00:35 Gabinet i wizyty
00:49 Karta klienta
01:16 Profil i rezerwacje
01:40 Link Google Meet do wizyty online
01:51 Szablony diet i przepisy
02:24 Tworzenie 7-dniowego pakietu
03:14 Kontrola i publikacja planu
03:40 Czat z klientem
03:52 Plan w aplikacji klienta

#dietetyk #trenerpersonalny #Diecik
```

## Źródła i odtworzenie montażu

- Panel: `../Nagranie z ekranu 2026-09-29 o 15.59.18.mov`.
- Aktualne nagranie aplikacji: `sources/iphone-17-od-specjalisty-varied-raw.mov`, zakres 15,88–37,08 s.
- Pierwszy kadr pełnego dnia: `sources/iphone-full-day-overview.png`. Buduje go `automation/build-full-day-overview.mjs` z prawdziwych zrzutów 29 września.
- Muzyka: miks Diecik z Apple Loops. Opis licencji: `../meta-start-aplikacji/meta/audio/LICENSES.md`.
- Montaż: `automation/build-video.mjs`; uruchom z katalogu projektu przez `node marketing/reklamy/specjalista-youtube-2026-09-29/automation/build-video.mjs`.
- Dokładny zakres cięcia i hash plików zapisano w `output/manifest.json`.

Parametry renderu i wyniki kontroli zapisano w `tasks/todo.md` w głównym katalogu projektu.
