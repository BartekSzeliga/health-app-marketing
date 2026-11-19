from pathlib import Path
import json,re,datetime
folder=Path(__file__).parent
core='''Miej swój plan pod ręką. Diecik łączy licznik kalorii, jadłospisy i treningi, aby łatwiej uporządkować codzienne wybory. Zaplanuj posiłki, sprawdź makroskładniki i wróć do zapisanych treningów.

POSIŁKI PO TWOJEMU
Przeglądaj posiłki i sumę kalorii, białka, węglowodanów, tłuszczu oraz błonnika. Ułóż jadłospis ręcznie lub skorzystaj z generatora. Zmieniaj produkty i dopracowuj porcje.

DODAWANIE BEZ PRZEPISYWANIA
Wyszukaj produkt w bazie, zeskanuj kod kreskowy albo przeanalizuj zdjęcie posiłku. AI proponuje składniki i ilości — sprawdź je i popraw przed zatwierdzeniem.

TRENING TEŻ MA PLAN
Wygeneruj plan treningowy lub ułóż własny. Dobieraj ćwiczenia, serie i powtórzenia. Korzystaj z instrukcji dostępnych przy ćwiczeniach i miej rozpisany trening pod ręką.

TWOJA HISTORIA POSTĘPÓW
Zapisuj wagę i pomiary. Przeglądaj wykresy z wybranego okresu, aby wracać do własnej historii.

SAMODZIELNIE LUB ZE SPECJALISTĄ
Połącz konto z dietetykiem lub trenerem i odbieraj opublikowane przez niego diety i treningi. Własne plany i plany od specjalisty mają osobne widoki. Odbiór udostępnionych planów nie wymaga Twojego indywidualnego Premium.

ZACZNIJ BEZPŁATNIE
• Ręcznie układaj dietę i eksportuj ją do PDF.
• Korzystaj z generatora diety standardowej.
• Zapisz do 3 ulubionych posiłków.
• Wykonaj do 10 analiz zdjęć posiłków miesięcznie.

ROZWIŃ MOŻLIWOŚCI Z PREMIUM
• Wybieraj spośród 6 typów diet w generatorze: standardowej, wysokobiałkowej, niskowęglowodanowej, wegetariańskiej, wegańskiej i keto.
• Kopiuj dni i tygodnie, aby wracać do sprawdzonych planów.
• Przygotuj listę zakupów do własnej diety.
• Zapisuj ulubione posiłki bez limitu.
• Korzystaj z limitu do 100 analiz zdjęć posiłków miesięcznie.

Premium jest opcjonalne. Aktualną cenę, okres dostępu i warunki zakupu zobaczysz przed potwierdzeniem płatności.

Zacznij od zaplanowania najbliższego posiłku.

Diecik pomaga organizować dietę i aktywność. Nie zastępuje porady lekarza, dietetyka ani indywidualnej opieki medycznej.'''
google_full=core+'''\n\nSubskrypcją kupioną w Google Play zarządzasz w ustawieniach sklepu. Warunki odnowienia są pokazywane przed zakupem.\n\nPolityka prywatności: https://diecik.com/privacy'''
apple_full=core+'''\n\nSubskrypcjami kupionymi w App Store zarządzasz w ustawieniach konta Apple. Subskrypcja odnawia się automatycznie, chyba że wyłączysz odnowienie przed końcem okresu. Cenę i warunki potwierdza App Store przed zakupem.\n\nPolityka prywatności: https://diecik.com/privacy\nWarunki użytkowania (EULA): https://www.apple.com/legal/internet-services/itunes/dev/stdeula/'''
fields={
 'pl-google-play-short.txt':'Licz kalorie, planuj posiłki i treningi. Twój plan zawsze pod ręką.',
 'pl-google-play-full.txt':google_full,
 'pl-apple-promotional-text.txt':'Planuj posiłki i treningi po swojemu. Sprawdzaj kalorie, korzystaj z analizy zdjęć i obserwuj postępy. Zacznij bezpłatnie, rozwiń możliwości z Premium.',
 'pl-apple-description.txt':apple_full,
 'pl-apple-keywords.txt':'jadłospis,makro,przepisy,waga,postępy,skaner,produkty,białko,planer,ćwiczenia,zakupy',
 'pl-apple-subtitle.txt':'Kalorie i plan posiłków',
}
limits={'pl-google-play-short.txt':80,'pl-google-play-full.txt':4000,'pl-apple-promotional-text.txt':170,'pl-apple-description.txt':4000,'pl-apple-keywords.txt':100,'pl-apple-subtitle.txt':30}
for file,value in fields.items():
 assert len(value)<=limits[file],(file,len(value),limits[file])
 (folder/file).write_text(value+'\n')
screens=[
 {'order':1,'headline':'Kalorie pod kontrolą','subline':'Posiłki i makroskładniki w jednym widoku dnia.','badge':None,'footnote':None,'show':'Rzeczywisty ekran Moja dieta: kalorie i makro oraz czytelne posiłki.','benefit':'Od razu widać podstawową wartość aplikacji.','availability':'Podstawowe planowanie bezpłatnie.'},
 {'order':2,'headline':'Gotowy plan posiłków','subline':'Wygeneruj jadłospis i dopracuj go po swojemu.','badge':None,'footnote':'Dieta standardowa bezpłatnie. Pozostałe typy w Premium.','show':'Faktyczny podgląd wygenerowanej diety z nazwami potraw i zdjęciami.','benefit':'Punkt startowy zamiast pustej kartki.','availability':'Standard free; inne typy Premium. Pokazać faktyczny typ widoczny w targetbuildzie.'},
 {'order':3,'headline':'Dodawaj bez przepisywania','subline':'Zeskanuj kod lub przeanalizuj zdjęcie posiłku.','badge':None,'footnote':'Wynik AI sprawdź przed zatwierdzeniem. Obowiązują limity planu.','show':'Prawdziwy ekran analizy zdjęcia z edytowalnymi składnikami; mały rzeczywisty detal skanera, jeśli mieści się bez tłoku.','benefit':'Mniej ręcznego wprowadzania produktów.','availability':'Zdjęcia: do10/mies.free i do100/mies.Premium. Nie sugerować, że AI automatycznie lub idealnie waży posiłek.'},
 {'order':4,'headline':'Trening też ma plan','subline':'Układaj treningi i sprawdzaj instrukcje ćwiczeń.','badge':None,'footnote':None,'show':'Faktyczny trening z ćwiczeniami i seriami; instrukcja jednego obsługiwanego ćwiczenia.','benefit':'Dieta i aktywność w tej samej aplikacji.','availability':'Planer treningów zaimplementowany; nie obiecywać osobistego trenera ani wideo dla każdego ćwiczenia.'},
 {'order':5,'headline':'Zobacz swoje postępy','subline':'Obserwuj zapisaną wagę i pomiary na wykresach.','badge':None,'footnote':None,'show':'Rzeczywisty wykres wagi z datami i zapisanymi pomiarami; bez zdjęć przed/po.','benefit':'Własna historia w czytelnej formie.','availability':'W targetbuildzie obowiązkowo sprawdzić układ pomiarów. Bez obietnicy spadku wagi.'},
 {'order':6,'headline':'Zakupy z Twojego planu','subline':'Zbierz produkty z jadłospisu na jednej liście.','badge':'Premium · własna dieta','footnote':None,'show':'Lista zakupów własnej diety z nazwami produktów, ilościami i zaznaczaniem kupionych.','benefit':'Plan posiłków przydaje się też w sklepie.','availability':'Lista własnej diety wymaga Premium. Nie przenosić tej zasady na listy udostępnione przez specjalistę.'},
 {'order':7,'headline':'Plan specjalisty pod ręką','subline':'Odbieraj udostępnione diety i treningi w aplikacji.','badge':None,'footnote':'Po połączeniu konta i opublikowaniu planu przez specjalistę.','show':'Prawdziwy widok Od specjalisty, z czytelnym planem i nazwą przykładowego specjalisty.','benefit':'Wygodny odbiór zaleceń we własnym telefonie.','availability':'Odbiór planów nie wymaga indywidualnego Premium; nie sugerować bezpłatnej konsultacji ani specjalisty zapewnianego przez Diecik.'},
 {'order':8,'headline':'Wracaj do swoich posiłków','subline':'Zapisuj ulubione i dodawaj je do kolejnych dni.','badge':None,'footnote':'Do 3 ulubionych bezpłatnie. Bez limitu w Premium.','show':'Faktyczny wybór ulubionych posiłków, z widocznym dodaniem do dnia.','benefit':'Codzienna wygoda i powrót do sprawdzonych wyborów.','availability':'3free; unlimited favourites Premium, nie unlimitedAI.'},
]
for s in screens:
 assert 3<=len(s['headline'].split())<=5,(s['headline'],len(s['headline'].split()))
 for key in ['subline','headline']:
  assert '\n' not in s[key]
pair_variant={'replacesOrder':8,'headline':'Wspólne dania, własne porcje','subline':'Korzystaj z planu dla pary od specjalisty.','badge':None,'footnote':'Przy aktywnym współdzieleniu i udostępnionym planie.','show':'Rzeczywisty ekran wspólnego gotowania: te same dania, osobne ilości i wspólne składniki.','releaseGate':'Zaimplementowane w aktualnym repo i sprawdzone we wcześniejszym QA; publiczny AppStore pokazuje1.0.21 z21października, co nie potwierdza zawartości świeżych zmian par. Użyć dopiero po potwierdzeniu funkcji w binary dla edytowanej wersji. Nie publikować screenshotu samego mocka jako istniejącego UI.'}
assert 3<=len(pair_variant['headline'].split())<=5
story={'language':'pl-PL','appNameKeep':'Diecik: dieta i trening','positioning':'Codzienny plan jedzenia i treningów, samodzielnie lub ze swoim specjalistą.','screens':screens,'conditionalPairVariant':pair_variant,'designNotes':['Pierwsze3ekrany opowiadają konkretną korzyść: rozeznanie dnia → gotowy punkt startu → wygodniejsze dodawanie.','Jeden duży nagłówek i jedna sublinia; faktyczne UI ma zajmować główną część kadru.','Footnotes mają być czytelne. Badge Premium na liście zakupów jest częścią głównego komunikatu.','Żadnych rankingów, ocen, liczników klientów, gwarancji chudnięcia ani zmiany sylwetki.','Nie dodawać B2Bplanów Starter/Pro/Studio/Firma do materiałów konsumenckich.']}
(folder/'pl-screenshots.json').write_text(json.dumps(story,ensure_ascii=False,indent=2)+'\n')
(folder/'pl-screenshot-story.txt').write_text('\n\n'.join(str(s['order'])+'. '+s['headline']+'\n'+s['subline']+(('\nBadge: '+s['badge']) if s['badge'] else '')+(('\nDopisek: '+s['footnote']) if s['footnote'] else '') for s in screens)+'\n\nWARIANT WARUNKOWY8: '+pair_variant['headline']+'\n'+pair_variant['subline']+'\nWarunek: potwierdzone pary w sklepowym binary.\n')
feature={'headline':'Dieta. Trening. Twój plan.','subline':'Kalorie, posiłki i ruch w jednej aplikacji.'}
(folder/'pl-feature-graphic.txt').write_text(feature['headline']+'\n'+feature['subline']+'\n')
payload={'language':'pl-PL','nameKeep':'Diecik: dieta i trening','googlePlay':{'shortDescription':fields['pl-google-play-short.txt'],'fullDescription':fields['pl-google-play-full.txt']},'appStore':{'promotionalText':fields['pl-apple-promotional-text.txt'],'description':fields['pl-apple-description.txt'],'keywords':fields['pl-apple-keywords.txt'],'subtitle':fields['pl-apple-subtitle.txt']},'screenshots':story,'featureGraphic':feature,'conditionalPairDescription':'Jeśli specjalista udostępni Wam plan dla pary i współdzielenie jest aktywne, możecie korzystać ze wspólnego gotowania z osobnymi porcjami.','status':'COPY READY FOR ROOT REVIEW; no store writes by copy agent'}
(folder/'pl-store-copy.json').write_text(json.dumps(payload,ensure_ascii=False,indent=2)+'\n')
counts={file:{'characters':len(value),'limit':limits[file],'remaining':limits[file]-len(value)} for file,value in fields.items()}
(folder/'character-counts.json').write_text(json.dumps(counts,ensure_ascii=False,indent=2)+'\n')
print(json.dumps(counts,ensure_ascii=False,indent=2))
