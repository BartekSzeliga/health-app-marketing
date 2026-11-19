import fsp from 'node:fs/promises';
import { createCanvas, loadImage } from '@napi-rs/canvas';
import { FONTY } from './motyw.mjs';
import { Blad } from './wspolne.mjs';

export { createCanvas, loadImage };

// Geometria ramki telefonu i karty detalu z zaakceptowanych rendererów
// (grafiki: render-static.mjs, film: render-videos.mjs z 21.10.2026).
export const STYL = {
  grafika: {
    telefon: { cien: 'rgba(0,16,12,.38)', rozmycie: 55, przesuniecie: 25, margines: 12, promien: 65, obrys: 11, promienObrysu: 63, promienEkranu: 52 },
    detal: { cien: 'rgba(0,15,10,.32)', rozmycie: 42, przesuniecie: 18, promien: 30 },
  },
  film: {
    telefon: { cien: 'rgba(0,20,10,.29)', rozmycie: 44, przesuniecie: 24, margines: 12, promien: 60, obrys: 10, promienObrysu: 58, promienEkranu: 48 },
    detal: { cien: 'rgba(0,20,10,.24)', rozmycie: 46, przesuniecie: 24, promien: 30 },
  },
};

const pamiecObrazow = new Map();
export async function wczytajObraz(plik) {
  if (!pamiecObrazow.has(plik)) {
    const bufor = await fsp.readFile(plik);
    pamiecObrazow.set(plik, { obraz: await loadImage(bufor), bufor });
  }
  return pamiecObrazow.get(plik);
}

/**
 * Płótno z kontrolą napisów. Każdy napis jest mierzony; przepełnienie
 * szerokości, wyjście poza bezpieczną ramkę i zasłonięcie przez element
 * trafiają do `problemy` zamiast po cichu psuć kreację.
 */
export class Plotno {
  constructor(szerokosc, wysokosc, { skala = 1, ramka = null, styl = 'grafika', kolory, nazwa = '', przesuniecieY = 0 } = {}) {
    this.canvas = createCanvas(szerokosc, wysokosc);
    this.ctx = this.canvas.getContext('2d');
    this.skala = skala;
    this.przesuniecieY = przesuniecieY; // okno na wyższy projekt: rysujemy w tych samych współrzędnych, widać wycinek
    this.ramka = ramka; // { lewo, prawo, gora, dol } w jednostkach projektu
    this.styl = STYL[styl];
    this.kolory = kolory;
    this.nazwa = nazwa;
    this.napisy = [];
    this.problemy = [];
    this.wyczysc();
  }

  wyczysc() {
    const { ctx } = this;
    ctx.setTransform(1, 0, 0, 1, 0, 0);
    ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
    ctx.scale(this.skala, this.skala);
    if (this.przesuniecieY) ctx.translate(0, -this.przesuniecieY);
  }

  problem(tresc) {
    const wpis = this.nazwa ? `${this.nazwa}: ${tresc}` : tresc;
    // Film rysuje ten sam napis w setkach klatek — problem zgłaszamy raz.
    if (!this.problemy.includes(wpis)) this.problemy.push(wpis);
  }

  font(rozmiar, { szeryf = false, waga = 500 } = {}) {
    return `${szeryf ? 400 : waga} ${rozmiar}px "${szeryf ? FONTY.szeryf : FONTY.bezszeryf}"`;
  }

  szerokoscTekstu(wartosc, rozmiar, opcje = {}) {
    this.ctx.save();
    this.ctx.font = this.font(rozmiar, opcje);
    const szerokosc = this.ctx.measureText(wartosc).width;
    this.ctx.restore();
    return szerokosc;
  }

  tekst(wartosc, x, y, rozmiar, { kolor = this.kolory.ink, max = null, szeryf = false, waga = 500, wyrownanie = 'left', alfa = 1, audyt = true } = {}) {
    if (alfa <= 0) return null;
    const { ctx } = this;
    ctx.save();
    ctx.font = this.font(rozmiar, { szeryf, waga });
    ctx.textAlign = wyrownanie;
    ctx.textBaseline = 'alphabetic';
    const miara = ctx.measureText(wartosc);
    const lewo = x - (wyrownanie === 'center' ? miara.width / 2 : wyrownanie === 'right' ? miara.width : 0);
    const pole = { tekst: wartosc, lewo, prawo: lewo + miara.width, gora: y - miara.actualBoundingBoxAscent, dol: y + miara.actualBoundingBoxDescent, rozmiar };
    if (audyt) {
      if (max !== null && miara.width > max) this.problem(`napis „${wartosc}” ma ${Math.ceil(miara.width)} px przy dozwolonych ${max} px — skróć go albo podziel na linie`);
      const r = this.ramka;
      if (r && (pole.lewo < r.lewo || pole.prawo > r.prawo || pole.gora < r.gora || pole.dol > r.dol)) {
        this.problem(`napis „${wartosc}” wychodzi poza bezpieczną strefę (x ${Math.round(pole.lewo)}–${Math.round(pole.prawo)}, y ${Math.round(pole.gora)}–${Math.round(pole.dol)}; dozwolone x ${r.lewo}–${r.prawo}, y ${r.gora}–${r.dol})`);
      }
      this.napisy.push(pole);
    }
    ctx.fillStyle = kolor;
    ctx.globalAlpha = alfa;
    ctx.fillText(wartosc, x, y);
    ctx.restore();
    return pole;
  }

  linie(wartosci, x, y, rozmiar, interlinia, opcje = {}) {
    return wartosci.map((wartosc, numer) => this.tekst(wartosc, x, y + numer * interlinia, rozmiar, opcje));
  }

  zaokraglij(x, y, szerokosc, wysokosc, promien) {
    this.ctx.beginPath();
    this.ctx.roundRect(x, y, szerokosc, wysokosc, promien);
  }

  /** Zgłasza napisy, które element o podanym prostokącie by zasłonił. */
  sprawdzZasloniecie(prostokat, opis, filtr = () => true) {
    for (const pole of this.napisy.filter(filtr)) {
      if (pole.prawo > prostokat.x && pole.lewo < prostokat.x + prostokat.szerokosc && pole.dol > prostokat.y && pole.gora < prostokat.y + prostokat.wysokosc) {
        this.problem(`${opis} zasłania napis „${pole.tekst}” — skróć linię albo zmień położenie`);
      }
    }
  }

  /** Cały zrzut ekranu w ramce telefonu; piksele aplikacji są tylko skalowane. */
  telefon(obraz, { x, y, wysokosc, kat = 0, alfa = 1 }) {
    const { ctx } = this;
    const s = this.styl.telefon;
    const szerokosc = wysokosc * obraz.width / obraz.height;
    ctx.save();
    ctx.translate(x, y);
    ctx.rotate(kat);
    ctx.globalAlpha = alfa;
    ctx.shadowColor = s.cien; ctx.shadowBlur = s.rozmycie; ctx.shadowOffsetY = s.przesuniecie;
    ctx.fillStyle = this.styl === STYL.film ? this.kolory.filmRamkaTelefonu : this.kolory.ramkaTelefonu;
    this.zaokraglij(-szerokosc / 2 - s.margines, -wysokosc / 2 - s.margines, szerokosc + 2 * s.margines, wysokosc + 2 * s.margines, s.promien);
    ctx.fill();
    ctx.shadowColor = 'transparent';
    ctx.strokeStyle = this.styl === STYL.film ? this.kolory.filmObrysTelefonu : this.kolory.obrysTelefonu;
    ctx.lineWidth = 2;
    this.zaokraglij(-szerokosc / 2 - s.obrys, -wysokosc / 2 - s.obrys, szerokosc + 2 * s.obrys, wysokosc + 2 * s.obrys, s.promienObrysu);
    ctx.stroke();
    ctx.save();
    this.zaokraglij(-szerokosc / 2, -wysokosc / 2, szerokosc, wysokosc, s.promienEkranu);
    ctx.clip();
    ctx.drawImage(obraz, -szerokosc / 2, -wysokosc / 2, szerokosc, wysokosc);
    ctx.restore();
    ctx.restore();
    return { x, y, szerokosc, wysokosc, kat };
  }

  /** Kadr prawdziwego ekranu jako karta; x, y to lewy górny róg. */
  detal(obraz, kadr, { x, y, szerokosc, alfa = 1 }) {
    const { ctx } = this;
    const s = this.styl.detal;
    if (kadr.x < 0 || kadr.y < 0 || kadr.x + kadr.szer > obraz.width + 0.5 || kadr.y + kadr.wys > obraz.height + 0.5) {
      throw new Blad(`Kadr ${JSON.stringify(kadr)} wychodzi poza źródło ${obraz.width}×${obraz.height}.`);
    }
    const wysokosc = szerokosc * kadr.wys / kadr.szer;
    ctx.save();
    ctx.globalAlpha = alfa;
    ctx.shadowColor = s.cien; ctx.shadowBlur = s.rozmycie; ctx.shadowOffsetY = s.przesuniecie;
    ctx.fillStyle = '#FFFFFF';
    this.zaokraglij(x, y, szerokosc, wysokosc, s.promien);
    ctx.fill();
    ctx.shadowColor = 'transparent';
    this.zaokraglij(x, y, szerokosc, wysokosc, s.promien);
    ctx.clip();
    ctx.drawImage(obraz, kadr.x, kadr.y, kadr.szer, kadr.wys, x, y, szerokosc, wysokosc);
    ctx.restore();
    return { x, y, szerokosc, wysokosc };
  }

  /** Zrzut panelu web w prostej ramce okna przeglądarki; x, y to lewy górny róg ramki. */
  panel(obraz, { x, y, szerokosc, alfa = 1 }) {
    const { ctx } = this;
    const pasek = Math.round(szerokosc * 0.034);
    const wysokoscEkranu = szerokosc * obraz.height / obraz.width;
    const wysokosc = pasek + wysokoscEkranu;
    const promien = Math.round(szerokosc * 0.016);
    ctx.save();
    ctx.globalAlpha = alfa;
    ctx.shadowColor = this.styl.telefon.cien; ctx.shadowBlur = this.styl.telefon.rozmycie; ctx.shadowOffsetY = this.styl.telefon.przesuniecie;
    ctx.fillStyle = '#FFFFFF';
    this.zaokraglij(x, y, szerokosc, wysokosc, promien);
    ctx.fill();
    ctx.shadowColor = 'transparent';
    this.zaokraglij(x, y, szerokosc, wysokosc, promien);
    ctx.clip();
    ctx.fillStyle = '#ECEEE9';
    ctx.fillRect(x, y, szerokosc, pasek);
    for (const [numer, kolor] of ['#E0867C', '#E5C07B', '#8FC59B'].entries()) {
      ctx.fillStyle = kolor;
      ctx.beginPath();
      ctx.arc(x + pasek * (0.75 + numer * 0.62), y + pasek / 2, pasek * 0.17, 0, Math.PI * 2);
      ctx.fill();
    }
    ctx.drawImage(obraz, x, y + pasek, szerokosc, wysokoscEkranu);
    ctx.restore();
    ctx.save();
    ctx.globalAlpha = alfa;
    ctx.strokeStyle = 'rgba(0,0,0,.10)';
    ctx.lineWidth = 1.5;
    this.zaokraglij(x, y, szerokosc, wysokosc, promien);
    ctx.stroke();
    ctx.restore();
    return { x, y, szerokosc, wysokosc };
  }

  /**
   * Blok ceny, np. „od 600 zł miesięcznie · brutto”: kwota jest największym
   * elementem. Na jasnym tle stoi na limonkowym podświetleniu, na ciemnym
   * sama jest limonkowa. `y` to linia bazowa kwoty; zwraca zajęty prostokąt.
   */
  cena(cena, { x, y, rozmiar = 150, srodek = false, ciemne = false, alfa = 1 }) {
    if (alfa <= 0) return null;
    const { ctx, kolory: K } = this;
    const maly = Math.round(rozmiar * 0.3);
    const odstep = Math.round(rozmiar * 0.15);
    const szer = {
      przed: cena.przed ? this.szerokoscTekstu(cena.przed, maly, { waga: 600 }) : 0,
      kwota: this.szerokoscTekstu(cena.kwota, rozmiar, { szeryf: true }),
      po: Math.max(cena.po ? this.szerokoscTekstu(cena.po, maly, { waga: 600 }) : 0, cena.dopisek ? this.szerokoscTekstu(cena.dopisek, Math.round(maly * 0.82), { waga: 500 }) : 0),
    };
    const calosc = szer.przed + (cena.przed ? odstep : 0) + szer.kwota + (szer.po ? odstep : 0) + szer.po;
    let lewo = srodek ? x - calosc / 2 : x;
    const poczatek = lewo;
    const glowny = ciemne ? K.cream : K.ink;
    if (cena.przed) { this.tekst(cena.przed, lewo, y, maly, { waga: 600, kolor: glowny, alfa }); lewo += szer.przed + odstep; }
    if (!ciemne) {
      ctx.save(); ctx.globalAlpha = alfa; ctx.fillStyle = K.lime;
      this.zaokraglij(lewo - rozmiar * 0.07, y - rozmiar * 0.36, szer.kwota + rozmiar * 0.14, rozmiar * 0.44, rozmiar * 0.07);
      ctx.fill(); ctx.restore();
    }
    this.tekst(cena.kwota, lewo, y, rozmiar, { szeryf: true, kolor: ciemne ? K.lime : K.ink, alfa });
    lewo += szer.kwota + odstep;
    // „miesięcznie” nad „brutto”, oba przy kwocie; bez dopisku „miesięcznie” stoi na linii bazowej.
    if (cena.po) this.tekst(cena.po, lewo, cena.dopisek ? y - Math.round(maly * 1.12) : y, maly, { waga: 600, kolor: glowny, alfa });
    if (cena.dopisek) this.tekst(cena.dopisek, lewo, y, Math.round(maly * 0.82), { waga: 500, kolor: ciemne ? K.mint : K.muted, alfa: alfa * 0.9 });
    return { x: poczatek, y: y - rozmiar * 0.72, szerokosc: calosc, wysokosc: rozmiar * 0.8 };
  }

  /** Logo i nazwa marki; logo zachowuje proporcje, wysokość `rozmiar`. */
  marka(motyw, logo, { x, y, rozmiar, rozmiarNazwy, kolor = this.kolory.ink, alfa = 1, liniaBazowa, odstep = rozmiar * 16 / 78, max = null, srodek = false }) {
    const szerokoscLogo = rozmiar * logo.width / logo.height;
    const szerokoscNazwy = this.szerokoscTekstu(motyw.nazwa, rozmiarNazwy, { waga: 700 });
    const lewo = srodek ? x - (szerokoscLogo + odstep + szerokoscNazwy) / 2 : x;
    this.ctx.save();
    this.ctx.globalAlpha = alfa;
    this.ctx.drawImage(logo, lewo, y, szerokoscLogo, rozmiar);
    this.ctx.restore();
    this.tekst(motyw.nazwa, lewo + szerokoscLogo + odstep, liniaBazowa, rozmiarNazwy, { kolor, waga: 700, max, alfa });
  }
}
