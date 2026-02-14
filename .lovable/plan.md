

## Corrigir posicionamento do Tour de Onboarding

**Problema**: O tooltip do tour sai da tela quando aponta para elementos como a categoria "Ideacao", porque o calculo de posicao usa uma altura fixa estimada (180px) e nao verifica os limites da viewport.

**Solucao**:

1. **Medir o tooltip real** -- Usar o `tooltipRef` que ja existe para obter as dimensoes reais do tooltip apos renderizacao, em vez de usar valores fixos (`tooltipW = 340`, `tooltipH = 180`).

2. **Clampar posicao na viewport** -- Apos calcular `top` e `left`, garantir que o tooltip nao ultrapasse os limites da tela:
   - `top` entre `16px` e `window.innerHeight - tooltipHeight - 16px`  
   - `left` entre `16px` e `window.innerWidth - tooltipWidth - 16px`

3. **Fallback de posicao** -- Se o tooltip nao cabe na posicao configurada (ex: "bottom" mas nao ha espaco abaixo), inverter automaticamente para a posicao oposta (ex: "top").

4. **Recalcular apos animacao** -- Adicionar um pequeno `requestAnimationFrame` ou segundo calculo apos o tooltip renderizar para ajustar com as dimensoes reais.

### Detalhes tecnicos

No arquivo `src/components/onboarding/OnboardingTour.tsx`:

- Substituir os valores fixos `tooltipW` e `tooltipH` por medidas do `tooltipRef.current?.getBoundingClientRect()`
- Adicionar logica de fallback: se `rect.bottom + gap + realH > window.innerHeight`, usar posicao "top" em vez de "bottom"
- Aplicar `Math.max(16, Math.min(calculatedTop, window.innerHeight - realH - 16))` no `style.top`
- Usar `useLayoutEffect` ou duplo calculo para garantir que as dimensoes estejam disponiveis

