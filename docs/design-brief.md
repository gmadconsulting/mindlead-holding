# Mindlead Group — Brief estetico e di motion

Prompt per Cursor. Va letto insieme a `docs/copy.md`, che resta la fonte unica dei testi.

---

## Prompt da incollare in Cursor

```
Costruisci il sito di Mindlead Group seguendo docs/copy.md per i testi e
docs/design-brief.md per estetica, layout e animazioni. Non inventare copy,
numeri o clienti. Lavora per sezioni: prima il sistema (token, tipografia,
griglia, smooth scroll, componenti di animazione), poi le sezioni della home
nell'ordine del copy, una alla volta, verificando ognuna su desktop e mobile
prima di passare alla successiva. Ogni animazione deve rispettare
prefers-reduced-motion e il budget di performance indicato nel brief.
```

---

## 1. Direzione

**In una frase:** la calma editoriale di uno studio di architettura, con la precisione di un prodotto software di alto livello.

Due riferimenti da fondere, senza copiarne nessuno:

| Dal riferimento editoriale (studio di architettura) | Dal riferimento software (CRM moderno) |
| --- | --- |
| Bianco nebbia, grigi caldi, immagini quasi monocrome | Interfacce nitide, bordi sottili, superfici in strati |
| Titoli enormi in grotesk con interlinea stretta | Microanimazioni precise, mai decorative |
| Etichette piccole in monospace | Griglie di punti e linee che emergono dallo sfondo |
| Griglia verticale a linee sottilissime visibile | Card "bento" con contenuti vivi |
| Moltissimo spazio vuoto, pochissime parole | Loghi e nodi che orbitano e reagiscono al cursore |
| Footer di pagina con località e © anno | Sezioni scure di contrasto per i momenti chiave |

Il risultato deve sembrare una holding solida che costruisce tecnologia, non un'agenzia che vuole stupire. Ogni effetto deve avere un motivo: guidare lo sguardo, spiegare la struttura del gruppo, dare ritmo alla lettura.

---

## 2. Sistema visivo

### Colori (solo scala di bianchi e grigi)

```css
:root {
  --bg:          #FAFAF9;  /* bianco nebbia, sfondo principale */
  --bg-elevated: #FFFFFF;  /* card e superfici */
  --bg-sunken:   #F2F2F0;  /* fasce alternate */
  --line:        #E7E6E3;  /* griglia e bordi */
  --line-strong: #D4D3CF;
  --text-faint:  #B5B4AF;  /* testo "spento" prima dell'highlight */
  --text-muted:  #6E6D69;
  --text:        #0E0E0D;  /* quasi nero */
  --ink:         #0A0A0A;  /* sezioni scure */
  --ink-line:    #1F1F1E;
  --ink-text:    #EDEDEB;
}
```

Nessun colore d'accento. L'enfasi si ottiene con contrasto, peso e movimento. Unica eccezione ammessa: un punto verde minuscolo per lo stato "Disponibile" nelle card dei prodotti.

### Tipografia

- **Titoli:** Geist (o Inter Display), peso 500, interlinea 0.95–1.0, tracking da -0.03em a -0.04em. Scala fluida con `clamp()`: hero da 48px a 112px.
- **Testo:** Geist 400, 17–19px, interlinea 1.5, colore `--text-muted`.
- **Etichette e metadati:** Geist Mono 400, 12–13px, colore `--text-muted`. Usate per numeri di sezione (`01 — Il gruppo`), categorie, località, anno, stato delle aziende.
- Caricare i font con `next/font` (niente font esterni da Google a runtime, anche per il GDPR).

### Griglia e struttura

- Contenitore massimo 1280px, 12 colonne.
- **Linee verticali sottili visibili** ai bordi del contenitore e a 1/3, come nel riferimento editoriale: `1px solid var(--line)`, a tutta altezza pagina, dietro ai contenuti.
- Sotto l'hero e nelle sezioni tecnologiche, una **griglia di punti** molto tenue (`radial-gradient`, opacità 0.4) che sfuma ai bordi con una maschera.
- Spaziatura verticale tra sezioni: 160–240px su desktop, 96–128px su mobile.
- Bordi arrotondati: 12px per le card, 999px per i bottoni. Bordi `1px` ovunque, ombre quasi assenti (`0 1px 2px rgba(0,0,0,0.04)`).

### Immagini

Fotografia di architettura in bianco e nero o quasi, desaturata, nebbiosa, prospettive dal basso, linee strutturali (vetro, acciaio, cemento). Comunicano solidità e costruzione senza mostrare persone o codice. Formato AVIF/WebP, `next/image`, sempre con overlay sfumato verso `--bg` per fondersi con la pagina.

---

## 3. Stack di animazione

| Libreria | Uso |
| --- | --- |
| `lenis` | Smooth scroll con inerzia, sincronizzato con GSAP |
| `gsap` + `ScrollTrigger` | Animazioni legate allo scroll, sezioni pinnate, scrub |
| `motion` (Framer Motion) | Hover, stati, layout animation, transizioni dei componenti React |
| View Transitions API | Transizioni tra pagine (Next.js App Router) |
| SVG + `requestAnimationFrame` | Orbite e linee dell'organigramma |

Niente Three.js o WebGL per ora: lo stesso effetto si ottiene con SVG e CSS, pesa molto meno e funziona su tutti i telefoni.

**Curve e tempi** (definire come costanti condivise):

```ts
export const ease = {
  out:    [0.16, 1, 0.3, 1],     // uscita morbida stile Apple
  inOut:  [0.65, 0, 0.35, 1],
};
export const duration = { fast: 0.25, base: 0.6, slow: 1.1 };
```

---

## 4. Effetti chiave

### A. Testo che si accende allo scroll (stile Apple)

Paragrafi manifesto (missione, "Il gruppo in una frase", apertura del Modello): il testo parte in `--text-faint` e ogni parola passa a `--text` man mano che si scorre, da sinistra a destra, legata alla posizione di scroll (scrub, non a tempo).

- Split in parole con un componente `<ScrollHighlight>`, non lettere.
- `ScrollTrigger` con `start: "top 80%"`, `end: "bottom 40%"`, `scrub: true`.
- Su mobile stesso effetto, range di scroll più corto.
- Con reduced-motion: testo direttamente a colore pieno.

### B. Titoli che entrano a maschera

Ogni titolo di sezione entra riga per riga: ogni riga sale da sotto una maschera (`overflow: hidden`, `translateY(100%)` → `0`), 80ms di sfalsamento tra le righe, durata 1.1s, curva `ease.out`. L'etichetta mono sopra (`02 — Le nostre aziende`) appare prima, in dissolvenza.

### C. Hero

- Titolo enorme a sinistra delle linee di griglia, come nel riferimento editoriale; colonna sinistra con elenco mono delle linee del gruppo (Advisory, Studio, Suite, Totalone, RelateSales) che si illuminano una alla volta all'avvio.
- Sfondo: fotografia architettonica nebbiosa con lento effetto parallasse (scala 1.08 → 1.0 durante lo scroll del primo schermo).
- In basso a sinistra in mono: `• Milano  • Dubai`; in basso a destra `© 2026`.
- Allo scroll, l'hero si comprime leggermente (scala 0.96, bordi che si arrotondano a 24px) mentre la sezione successiva sale sopra: effetto "scheda" stile Apple.

### D. L'orbita del gruppo (sezione centrale)

È la firma visiva del sito: spiega la struttura del gruppo senza leggere.

- Al centro un nodo "Mindlead Core" (cerchio con bordo sottile e un leggero pulsare, 4s).
- Primo anello: Mindlead Advisory, Studio, Suite. Secondo anello, più ampio: Totalone, RelateSales. Più un nodo tratteggiato "Prossima azienda" che invita alla sezione Partnership.
- Gli anelli ruotano lentissimi in direzioni opposte (60–90s a giro).
- **Reazione al cursore:** i nodi vicini al puntatore si spostano leggermente verso di esso (effetto magnetico, max 12px), il nodo sotto il cursore si ingrandisce e mostra una card con nome, una riga di descrizione e stato; le linee che lo collegano al centro si illuminano.
- **Allo scroll:** la sezione è pinnata; scorrendo, gli anelli si "assemblano" (nodi che arrivano dall'esterno), poi si mette a fuoco un'azienda alla volta con il suo testo a lato. Alla fine l'orbita si allarga e lascia spazio alla griglia delle aziende.
- Su mobile: niente pin lungo; orbita statica più piccola che ruota lentamente, con le aziende in una lista scorrevole sotto.

### E. Griglia delle aziende (bento)

- Card a dimensioni diverse: Mindlead Suite più grande (con anteprima stilizzata di un'interfaccia in grigi), le altre più piccole.
- Ogni card ha in mono la categoria e lo stato, il nome grande, una riga di descrizione.
- **Hover:** un riflesso di luce radiale segue il cursore dentro la card (`radial-gradient` posizionato con variabili CSS), il bordo si scurisce, la freccia si sposta di 4px. Leggera inclinazione 3D (max 3°).
- Entrata in sequenza dal basso, sfalsata di 60ms.

### F. Il ciclo del valore (pagina Modello)

Sezione pinnata con quattro step. Una linea SVG si disegna con lo scroll (`stroke-dashoffset`) collegando i quattro passaggi; lo step attivo è a colore pieno, gli altri spenti. Su mobile diventa una timeline verticale con la linea che si riempie.

### G. Mindlead Core (sezione scura)

Unico grande momento scuro (`--ink`), per dare peso alla tecnologia. La transizione dal chiaro allo scuro avviene durante lo scroll (sfondo che sfuma su 300px, non uno stacco). Contenuto: titolo, testo, e un diagramma a strati (Core alla base, aziende sopra) i cui livelli si sollevano e si separano in prospettiva allo scroll, con etichette mono. Griglia di punti chiara molto tenue sullo sfondo.

### H. Microinterazioni

- **Bottoni:** pill con bordo; all'hover lo sfondo si riempie dal basso (nero), il testo diventa bianco, la freccia scorre fuori a destra e rientra da sinistra.
- **Link:** sottolineatura che si disegna da sinistra a destra.
- **Cursore:** nessun cursore personalizzato globale; solo nelle zone interattive (orbita, card) un piccolo cerchio di 32px che segue il puntatore con ritardo.
- **Menu:** come nel riferimento editoriale, "Menu" + due linee in alto a destra; apre un pannello a tutto schermo bianco, con le voci grandi che entrano a maschera e a destra la lista mono delle aziende.
- **Header:** si nasconde scorrendo verso il basso, ricompare scorrendo verso l'alto, con sfondo sfocato (`backdrop-filter: blur(12px)`) quando non è in cima.

### I. Transizioni tra pagine

Con la View Transitions API: la pagina uscente si dissolve e scala a 0.98, la nuova sale di 24px con dissolvenza. Il titolo della card cliccata (es. un'azienda) "vola" nella posizione del titolo della pagina di destinazione (shared element con `view-transition-name`).

---

## 5. Responsive

- Mobile first. Breakpoint: 640 / 1024 / 1440.
- Su mobile: linee di griglia ridotte ai soli bordi, hero con titolo a 48px e foto sotto, nessuna sezione pinnata più alta di 1.5 schermi, effetti hover sostituiti da stati al tocco.
- Testare su iPhone Safari: smooth scroll, `100svh` invece di `100vh`, nessun salto della barra degli indirizzi.

---

## 6. Accessibilità e performance

- `prefers-reduced-motion`: niente smooth scroll, niente pin, niente parallasse; restano solo dissolvenze brevi. Il contenuto deve essere completo e leggibile senza nessuna animazione.
- Contrasto testo principale minimo AA; il grigio "spento" dell'highlight è solo uno stato di transizione, mai lo stato finale.
- Lighthouse: Performance ≥ 90 su mobile, CLS < 0.05, LCP < 2.5s.
- JavaScript delle animazioni caricato in modo dinamico (`next/dynamic`), le sezioni sotto la piega non bloccano il primo rendering.
- Animare solo `transform` e `opacity`; `will-change` solo durante l'animazione.
- Tutto navigabile da tastiera, focus visibile (anello di 2px `--text`).

---

## 7. Ordine di costruzione consigliato

1. Token, font, griglia di linee, layout base, header e footer.
2. Lenis + GSAP configurati, componenti `ScrollHighlight`, `MaskReveal`, `MagneticButton`.
3. Hero.
4. Testo manifesto con highlight allo scroll.
5. Orbita del gruppo (prima versione statica, poi rotazione, poi cursore, poi pin allo scroll).
6. Griglia bento delle aziende.
7. Sezione scura Mindlead Core.
8. Ciclo del valore, Partnership, Contatti.
9. Passata finale su mobile, reduced-motion e performance.

Chiedere conferma visiva dopo i punti 3, 5 e 7 prima di proseguire.
