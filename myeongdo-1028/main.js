const statusList = document.getElementById('status-list');

if (statusList) {
  const items = Array.from(statusList.children);

  items.forEach((item, index) => {
    item.style.opacity = '0';
    item.style.transform = 'translateY(8px)';

    setTimeout(() => {
      item.style.transition = 'all 0.25s ease';
      item.style.opacity = '1';
      item.style.transform = 'translateY(0)';
    }, 120 * index);
  });
}
