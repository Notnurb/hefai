import { format, isToday, isYesterday } from 'date-fns';

export function formatMessageDate(date: Date | string) {
    const d = new Date(date);
    if (isToday(d)) {
        return format(d, 'h:mm a');
    }
    if (isYesterday(d)) {
        return 'Yesterday ' + format(d, 'h:mm a');
    }
    return format(d, 'MMM d, h:mm a');
}

export function formatConversationDate(date: Date | string) {
    const d = new Date(date);
    if (isToday(d)) {
        return format(d, 'h:mm a');
    }
    if (isYesterday(d)) {
        return 'Yesterday';
    }
    return format(d, 'MMM d');
}
