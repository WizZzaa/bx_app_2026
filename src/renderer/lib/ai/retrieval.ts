import { getAllArticlesSync } from '../db/knowledgeRepo'

const STOP = new Set(['и','в','на','по','с','за','для','как','что','это','о','об','от','до','при','или','а','но','не','ли','же','бы','то','так','уже','если','есть','быть','мне','мой','моя','мои','нужно','можно','какой','какая','какие','сколько'])

// Русский стеммер Портера для морфологического поиска
function stem(word: string): string {
  word = word.toLowerCase().replace(/ё/g, 'е')
  const RVRE = /^(.*?[аеиоуыэюя])(.*)$/
  const match = word.match(RVRE)
  if (!match) return word
  
  const start = match[1]
  let rv = match[2]
  if (!rv) return word

  // Perfective Gerund
  const temp = rv.replace(/((ив|ивши|ившись|ыв|ывши|ывшись)|((?<=[ая])(в|вши|вшись)))$/, '')
  if (temp !== rv) {
    rv = temp
  } else {
    // Reflexive
    rv = rv.replace(/(ся|сь)$/, '')
    
    // Adjective
    const adj = rv.replace(/(ее|ие|ое|ые|ими|ыми|ей|ой|уй|ый|ем|им|ом|ым|его|ого|ему|ому|их|ых|ую|юю|ая|яя|ою|ею)$/, '')
    if (adj !== rv) {
      rv = adj
      // Participle
      rv = rv.replace(/((ивш|ывш|ующ)|((?<=[ая])(ем|нн|вш|ющ|щ)))$/, '')
    } else {
      // Verb
      const verb = rv.replace(/((ила|ыла|ена|ейте|уйте|ите|или|ыли|ий|уй|де|но|ло|но|то|на|ка|кась|ся|ь)|((?<=[ая])(ешь|н|нн|ло|на|но|то|ete|йте|ли|й|ть|тьсь|ь|ьсь)))$/, '')
      if (verb !== rv) {
        rv = verb
      } else {
        // Noun
        rv = rv.replace(/(а|ев|ов|ах|е|и|ия|ья|о|у|ах|ов|ям|ями|ях|у|ы|ь|ю|иям|иями|иях)$/, '')
      }
    }
  }

  // Superlative
  rv = rv.replace(/(ейш|ейше)$/, '')
  
  // Derivational
  rv = rv.replace(/ост$/, '')

  const tempI = rv.replace(/ь$/, '')
  if (tempI !== rv) {
    rv = tempI
  } else {
    rv = rv.replace(/ейше$/, '')
    rv = rv.replace(/нн$/, 'н')
  }

  return start + rv
}

function tokenize(text: string): string[] {
  return text.toLowerCase()
    .replace(/[^a-zа-яё0-9\s]/gi, ' ')
    .split(/\s+/)
    .filter(w => w.length >= 3 && !STOP.has(w))
    .map(w => stem(w))
}

export interface RetrievedArticle { title: string; body: string }

export function retrieveArticles(query: string, topK = 3): RetrievedArticle[] {
  const qTokens = tokenize(query)
  if (qTokens.length === 0) return []

  // Локальные статьи + кэш облачной CMS — AI видит и статьи из админки
  const scored = getAllArticlesSync().map(a => {
    // Токенизируем (и стеблируем) поля статьи для точного совпадения
    const titleTokens = tokenize(a.title)
    const tagTokens = tokenize((a.tags || []).join(' '))
    const bodyTokens = tokenize(a.body)

    let score = 0
    for (const t of qTokens) {
      // Совпадение в заголовке
      if (titleTokens.some(tt => tt.includes(t) || t.includes(tt))) {
        score += 5
      }
      // Совпадение в тегах
      if (tagTokens.some(tg => tg.includes(t) || t.includes(tg))) {
        score += 3
      }
      // Частота совпадений в теле
      const matches = bodyTokens.filter(bt => bt.includes(t) || t.includes(bt)).length
      score += Math.min(matches, 4)
    }
    return { article: a, score }
  })

  return scored
    .filter(s => s.score > 0)
    .sort((a, b) => b.score - a.score)
    .slice(0, topK)
    .map(s => ({
      title: s.article.title,
      body: s.article.body.length > 2500 ? s.article.body.slice(0, 2500) + '…' : s.article.body
    }))
}
