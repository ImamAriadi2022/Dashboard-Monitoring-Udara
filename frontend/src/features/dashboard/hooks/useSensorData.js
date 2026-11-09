import { useState, useEffect, useRef, useCallback } from 'react';
import {
  fetchLatest,
  fetchReadings,
  getDownloadUrl,
  parseUtcTimestamp,
} from '../../../services/api';

const SEND_INTERVAL_MS = 30000;
const OFFLINE_TIMEOUT_MS = SEND_INTERVAL_MS * 2.5;

export function useSensorData(
  roomId = 'h5',
  timeRange = '7d',
  chartInterval = '1m'
) {
  const [latest, setLatest] = useState(null);
  const [history, setHistory] = useState([]);
  const [status, setStatus] = useState('connecting'); // connecting, ok, offline, err
  const [statusText, setStatusText] = useState('CONNECTING...');
  const [lastUpdated, setLastUpdated] = useState(null);
  const [isLoading, setIsLoading] = useState(true);

  const lastIdRef = useRef(null);

  const updateConnectionStatus = useCallback((reading) => {
    if (!reading || !reading.recorded_at) {
      setStatus('warning');
      setStatusText('BELUM ADA DATA');
      return;
    }
    const recordedDate = parseUtcTimestamp(reading.recorded_at);
    const ageMs = recordedDate ? Date.now() - recordedDate.getTime() : Infinity;

    if (ageMs > OFFLINE_TIMEOUT_MS) {
      setStatus('offline');
      setStatusText('OFFLINE');
    } else {
      setStatus('ok');
      setStatusText('LIVE');
    }
  }, []);

  useEffect(() => {
    let isMounted = true;
    lastIdRef.current = null;
    setIsLoading(true);

    async function loadRoomData() {
      try {
        const [readingsData, latestData] = await Promise.all([
          fetchReadings({
            room: roomId,
            range: timeRange,
            interval: chartInterval,
          }),
          fetchLatest(roomId),
        ]);

        if (!isMounted) return;

        setHistory(Array.isArray(readingsData) ? readingsData : []);

        if (latestData && latestData.id) {
          lastIdRef.current = latestData.id;
          setLatest(latestData);
          setLastUpdated(new Date());
          updateConnectionStatus(latestData);
        } else if (Array.isArray(readingsData) && readingsData.length > 0) {
          const last = readingsData[readingsData.length - 1];
          lastIdRef.current = last.id;
          setLatest(last);
          setLastUpdated(new Date());
          updateConnectionStatus(last);
        } else {
          setLatest(null);
          setStatus('warning');
          setStatusText('BELUM ADA DATA');
        }
      } catch (err) {
        if (!isMounted) return;
        console.error('Error fetching data from backend:', err);
        setStatus('err');
        setStatusText('BRIDGE OFFLINE');
      } finally {
        if (isMounted) setIsLoading(false);
      }
    }

    loadRoomData();

    // Poll latest reading every 3s; refresh aggregated chart only when new data arrives
    const interval = setInterval(async () => {
      try {
        const current = await fetchLatest(roomId);
        if (!isMounted) return;

        if (current && current.id) {
          updateConnectionStatus(current);

          if (current.id !== lastIdRef.current) {
            lastIdRef.current = current.id;
            setLatest(current);
            setLastUpdated(new Date());

            // Refresh aggregated chart buckets so chart stays exact without raw jitter
            const updatedChart = await fetchReadings({
              room: roomId,
              range: timeRange,
              interval: chartInterval,
            });
            if (isMounted && Array.isArray(updatedChart)) {
              setHistory(updatedChart);
            }
          }
        }
      } catch (err) {
        // Keep previous state during transient network blip
      }
    }, 3000);

    return () => {
      isMounted = false;
      clearInterval(interval);
    };
  }, [roomId, timeRange, chartInterval, updateConnectionStatus]);

  const downloadData = (formatRange = timeRange) => {
    const url = getDownloadUrl(roomId, formatRange);
    window.open(url, '_blank');
  };

  return {
    latest,
    history,
    status,
    statusText,
    lastUpdated,
    isLoading,
    downloadData,
  };
}
