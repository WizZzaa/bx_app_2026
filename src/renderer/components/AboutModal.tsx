import React from 'react'
import { APP_VERSION, CHANGELOG } from '../../shared/version'
import { Dialog } from './ui/Dialog'
import './system-modals-a9.css'

interface Props {
  open: boolean
  onClose: () => void
}

export default function AboutModal({ open, onClose }: Props) {
  return (
    <Dialog
      open={open}
      onClose={onClose}
      title="О BX"
      description={`Версия ${APP_VERSION} · Для бухгалтеров Узбекистана`}
      closeLabel="Закрыть информацию о BX"
      className="bx-a9-about"
      footer={(
        <div className="bx-a9-about__footer">
          <span>© 2026 BX Software.</span>
          <span>Расчёты носят справочный характер</span>
        </div>
      )}
    >
      <div className="bx-a9-about__brand">
        <img src="./icon.png" alt="" className="bx-a9-about__icon" />
        <div>
          <p className="bx-a9-system-eyebrow">Навигация BX</p>
          <p className="bx-a9-about__name">Помощник бухгалтера</p>
        </div>
      </div>

      <section aria-labelledby="bx-a9-changelog-title">
        <h3 id="bx-a9-changelog-title" className="bx-a9-system-section-title">Что изменилось</h3>
        <div className="bx-a9-about__timeline">
          {CHANGELOG.map(entry => (
            <article key={entry.version} className="bx-a9-about__release">
              <div className="bx-a9-about__release-heading">
                <strong>v{entry.version}</strong>
                <span>{entry.title}</span>
                <time>{entry.date}</time>
              </div>
              <ul>
                {entry.changes.map(change => <li key={change}>{change}</li>)}
              </ul>
            </article>
          ))}
        </div>
      </section>
    </Dialog>
  )
}
