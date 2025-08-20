export function getStatusBadgeClass(status) {
    switch (status) {
        case 'mandated':
            return 'badge green';
        case 'permitted':
            return 'badge yellow';
        case 'none':
            return 'badge red';
        case 'planned':
        default:
            return 'badge gray';
    }
}
export function formatStatusLabel(status) {
    return status.charAt(0).toUpperCase() + status.slice(1);
}
