export const getLocalDateString = (date) => {
  return new Date(date.getTime() - (date.getTimezoneOffset() * 60000)).toISOString().split('T')[0];
};

export const getDateRange = (timeRange) => {
  const endDate = new Date();
  const startDate = new Date();
  
  switch(timeRange) {
    case '30days':
      startDate.setDate(endDate.getDate() - 30);
      break;
    case '3months':
      startDate.setMonth(endDate.getMonth() - 3);
      break;
    case '6months':
      startDate.setMonth(endDate.getMonth() - 6);
      break;
    case '1year':
      startDate.setFullYear(endDate.getFullYear() - 1);
      break;
    case 'all':
      startDate.setFullYear(2020); // Arbitrary old date
      break;
    default:
      startDate.setMonth(endDate.getMonth() - 3);
  }
  
  return { 
    startDate, 
    endDate,
    isoStartDate: getLocalDateString(startDate),
    isoEndDate: getLocalDateString(endDate)
  };
};

export const generateDateBuckets = (startDate, endDate, bucketType = 'week') => {
  const buckets = [];
  const current = new Date(startDate);
  
  // If bucketing by week, adjust start to the Monday
  if (bucketType === 'week') {
    const day = current.getDay();
    const diff = current.getDate() - day + (day === 0 ? -6 : 1); // adjust when day is sunday
    current.setDate(diff);
  } else if (bucketType === 'month') {
    current.setDate(1);
  }

  while (current <= endDate) {
    const bucketStart = new Date(current);
    let bucketEnd = new Date(current);
    let label = '';
    let tooltipLabel = '';

    if (bucketType === 'week') {
      bucketEnd.setDate(current.getDate() + 7);
      const endLabelDate = new Date(bucketEnd.getTime() - 86400000);
      
      const startMonth = bucketStart.toLocaleString('default', { month: 'short' });
      const endMonth = endLabelDate.toLocaleString('default', { month: 'short' });
      
      label = `${startMonth} ${current.getDate()}`;
      tooltipLabel = `${startMonth} ${current.getDate()} - ${endMonth} ${endLabelDate.getDate()}`;
    } else if (bucketType === 'month') {
      bucketEnd.setMonth(current.getMonth() + 1);
      label = current.toLocaleString('default', { month: 'short', year: '2-digit' });
      tooltipLabel = current.toLocaleString('default', { month: 'long', year: 'numeric' });
    } else {
      bucketEnd.setDate(current.getDate() + 1);
      const monthStr = current.toLocaleString('default', { month: 'short' });
      label = `${current.getDate()} ${monthStr}`;
      tooltipLabel = `${current.getDate()} ${current.toLocaleString('default', { month: 'long' })}`;
    }

    buckets.push({
      start: bucketStart,
      end: bucketEnd,
      label,
      tooltipLabel,
      value: 0
    });

    current.setTime(bucketEnd.getTime());
  }

  return buckets;
};
