export function getNotificationsFor(role: 'worker' | 'customer') {
  if (typeof window === 'undefined') return [];
  const stored = localStorage.getItem('notifications');
  if (!stored) return [];
  try {
    const list = JSON.parse(stored);
    return list.filter((n: any) => role === 'worker' ? n.forWorker : n.forCustomer);
  } catch (e) {
    return [];
  }
}

export function markNotificationRead(index: number, role: 'worker' | 'customer') {
  if (typeof window === 'undefined') return;
  const stored = localStorage.getItem('notifications');
  if (!stored) return;
  try {
    const list = JSON.parse(stored);
    let matchedIndex = -1;
    let count = 0;
    for (let i = 0; i < list.length; i++) {
      const isForRole = role === 'worker' ? list[i].forWorker : list[i].forCustomer;
      if (isForRole) {
        if (count === index) {
          matchedIndex = i;
          break;
        }
        count++;
      }
    }
    if (matchedIndex !== -1) {
      list[matchedIndex].read = true;
      localStorage.setItem('notifications', JSON.stringify(list));
      window.dispatchEvent(new Event('storage'));
    }
  } catch (e) {
    console.error(e);
  }
}

export function pushSharedNotification(notif: any) {
  if (typeof window === 'undefined') return;
  const stored = localStorage.getItem('notifications');
  let list = [];
  if (stored) {
    try {
      list = JSON.parse(stored);
    } catch (e) {}
  }
  list.unshift(notif);
  localStorage.setItem('notifications', JSON.stringify(list));
  window.dispatchEvent(new Event('storage'));
}
