# BarWijnig – projectlogboek

*Bijgehouden door Claude. Laatst bijgewerkt: 7 oktober 2026.*

## Het idee
Scan een wijnfles en hoor meteen het verhaal van die wijn, zoals Hitster dat doet met muziek. Twee versies per wijn:
- **Kort & krachtig** (±25 sec): een wijnweetje, wat je proeft, één ding om te onthouden.
- **Vertel me alles** (±1,5 min): het hele verhaal in een vaste volgorde.

## Links
| Wat | Waar |
|---|---|
| App (testversie) | https://lenvanuuden.github.io/BarWijnig/ |
| Code en data | https://github.com/LenVanUuden/BarWijnig |
| Design (Claude Design) | https://claude.ai/artifact/1Q3qfXHqnCkMuxcgCtBs9W |
| Verhaalformat | `FORMAT.md` in de repository |

## Belangrijke beslissingen
| Datum | Beslissing | Waarom |
|---|---|---|
| 7 okt | Start met de best verkochte wijnen in NL (doel 300, nu 30) | Vaste catalogus maakt het idee uitvoerbaar, zoals Hitster |
| 7 okt | Geen Vivino-teksten gebruiken, eigen teksten op basis van feiten | Auteursrecht en databankenrecht; eigen content is de moat |
| 7 okt | Claude doet research, schrijven, controle en bouwen | Len wil geen handwerk |
| 7 okt | Testfase volledig gratis (GitHub Pages, barcode-scan op toestel) | Eerst bewijzen dat mensen het gebruiken |
| 7 okt | Naam: **BarWijnig** | Keuze Len |
| 7 okt | Vast format, kort begint met "Het wijnweetje van deze fles!" | Herkenbaar, gestructureerd |
| 7 okt | Ontbrekende details → grappig zinnetje (5 varianten) | In plaats van "kan niet bevestigen" |
| 7 okt | Design via Claude Design: warm, gezellig, wiebelend vat, bewegende scanner | Keuze Len |
| 7 okt | Gamification (levels, kelder, badges) er voorlopig uit | Focus op scannen + verhaal |
| 7 okt | Proefkaart: Zie / Ruik / Proef in 3 lagen (fruit, maken, rijping) met iconen | Vivino-achtig, in één oogopslag |
| 7 okt | **Spotify eruit**, eigen audio in de app | Spotify levert vrijwel niets op en geeft drempel |
| 7 okt | Verdienmodel: affiliate via "Koop deze fles" en "Meer zoals deze" | Geld op het moment van hoogste interesse |
| 7 okt | Eerst gratis Piper-stem testen; Google Chirp 3 HD in de ideeënmap | Geen creditcard nodig in de testfase |

## Status
- [x] Basis-app online (scannen, zoeken, verhaal, onbekende fles)
- [x] 20 wijnen met kort + lang verhaal, proefkaart en bronnen
- [x] Nieuw design gebouwd
- [ ] Stem kiezen (6 Piper-stemmen verstuurd als stemproef)
- [ ] Audio voor alle wijnen genereren
- [x] 18+-check
- [x] "Meer zoals deze" (op druif, aroma's, herkomst) en "Koop deze fles" (verschijnt zodra er een affiliatelink is)
- [ ] Batch 3 (wijn 21–30)
- [ ] Barcodes koppelen (via testers die onbekende flessen doorsturen)

## Kosten tot nu toe
€0. Alles draait gratis op GitHub en op Claude Pro.

## Open punten voor Len
- Stem kiezen uit de stemproef.
- Aanmelden bij een affiliatenetwerk (Daisycon of Awin), bijvoorbeeld voor Wijnkring (4,9% commissie).
- Later: Claude-gesprek koppelen aan de laptop, zodat dit logboek ook daar staat.

## Logboek
**7 okt 2026**
- Idee besproken en kritisch doorgerekend (Spotify-verdienmodel, long tail, hallucinaties).
- Gekozen voor top-verkochte wijnen, eigen teksten, gratis testfase.
- GitHub-repository aangemaakt, app gebouwd en online gezet.
- 10 wijnen geschreven, format vastgelegd en herschreven met vaste openers en grappige zinnetjes.
- Design gemaakt in Claude Design, aangepast op feedback (gamification eruit, knoplabels, proefkaart) en gebouwd.
- Batch 2 toegevoegd (20 wijnen totaal).
- Besloten: Spotify eruit, affiliate erin. Piper-stemproef gemaakt (6 stemmen).
- 18+-check gebouwd (één keer per toestel). "Meer wijnen zoals deze" gebouwd op basis van de proefkaart. Spotify-knop vervangen door een eigen Luister-knop (actief zodra er audio is). Ideeënmap aangemaakt (Google Chirp HD-stem).
