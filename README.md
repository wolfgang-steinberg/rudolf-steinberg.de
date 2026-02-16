# rudolf-steinberg.de

Persönliche Website von **Prof. Dr. jur. Rudolf Steinberg** — Emeritierter Professor für Öffentliches Recht, Umweltrecht und Verwaltungswissenschaft an der Goethe-Universität Frankfurt am Main. Präsident der Goethe-Universität 2000–2008.

## Techstack

- Statisches HTML/CSS/JS (kein Framework, kein Build-Schritt)
- [Cormorant Garamond](https://fonts.google.com/specimen/Cormorant+Garamond) + [Source Sans 3](https://fonts.google.com/specimen/Source+Sans+3) (selbst gehostet, DSGVO-konform)
- [MiniSearch](https://lucaong.github.io/minisearch/) für die clientseitige Volltextsuche (201 Einträge)
- Keine Cookies, kein Tracking, keine externen Dienste

## Seiten

| Seite | Inhalt |
|-------|--------|
| `index.html` | Startseite mit Hero, Highlight-Cards, Schwerpunkte |
| `vita.html` | Akademischer Lebenslauf, Ehrungen, Mitgliedschaften, Gastprofessuren |
| `publikationen.html` | 27 Bücher, 107 Aufsätze, 20 Rezensionen |
| `vortraege.html` | 9 Vorträge mit PDF-Downloads |
| `goethe-universitaet.html` | Präsidentschaft, Campusentwicklung, Presse |
| `kontakt.html` | Kontaktformular (mailto-Fallback) |
| `impressum.html` | Impressum |
| `datenschutz.html` | Datenschutzerklärung |

## Deployment

```bash
rsync -avz --delete \
  --exclude '.git' --exclude '.gitignore' --exclude 'README.md' --exclude '.claude' \
  ./ wolfgang@artellics.com:/mnt/volume-nbg1-1/site/rudolf-steinberg.de/
```
