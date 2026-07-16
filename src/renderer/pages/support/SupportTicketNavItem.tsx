import { ResourceNavItem } from '../../components/workspace/ResourceWorkspace';
import type { BxTicket } from './useTickets';
import { formatTicketDate, TICKET_STATUS } from './supportUi';

interface Props {
  ticket: BxTicket;
  active: boolean;
  onOpen: () => void;
}

export function SupportTicketNavItem({ ticket, active, onOpen }: Props) {
  const status = TICKET_STATUS[ticket.status];

  return (
    <ResourceNavItem
      icon={ticket.status === 'answered' ? 'message' : 'headset'}
      label={ticket.subject}
      description={`Обновлено ${formatTicketDate(ticket.updated_at)}`}
      active={active}
      onClick={onOpen}
      suffix={(
        <span className={`shrink-0 rounded-full border px-2 py-1 text-[9px] font-black ${active ? status.activeCls : status.cls}`}>
          {status.label}
        </span>
      )}
    />
  );
}
