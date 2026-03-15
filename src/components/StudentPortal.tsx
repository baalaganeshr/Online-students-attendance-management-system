import React, { useState, useEffect, useRef, useCallback } from 'react';
import { format } from 'date-fns';
import { MapPin, CheckCircle, XCircle, Loader2, Navigation, Camera, RefreshCw, SignalHigh, SignalMedium, SignalLow } from 'lucide-react';
import Webcam from 'react-webcam';
import { motion, AnimatePresence } from 'framer-motion';
import { store, Student, AttendanceRecord } from '../store';
import { getDistanceInMeters, COLLEGE_LAT, COLLEGE_LNG, ALLOWED_RADIUS_METERS } from '../utils';

export default function StudentPortal() {
  const [students, setStudents] = useState<Student[]>([]);
  const [selectedStudent, setSelectedStudent] = useState<string>('');
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<AttendanceRecord | null>(null);
  const [error, setError] = useState<string>('');
  const [simulatedLocation, setSimulatedLocation] = useState<'real' | 'inside' | 'outside'>('real');
  
  const [photoData, setPhotoData] = useState<string | null>(null);
  const [isCapturing, setIsCapturing] = useState(false);
  const webcamRef = useRef<Webcam>(null);

  const [locationAccuracy, setLocationAccuracy] = useState<number | null>(null);
  const [locationError, setLocationError] = useState<string>('');
  const [reason, setReason] = useState<string>('');

  const capturePhoto = useCallback(() => {
    const imageSrc = webcamRef.current?.getScreenshot();
    if (imageSrc) {
      setPhotoData(imageSrc);
      setIsCapturing(false);
    }
  }, [webcamRef]);

  const retakePhoto = () => {
    setPhotoData(null);
    setIsCapturing(true);
  };

  const handleCameraError = useCallback((err: string | DOMException) => {
    setIsCapturing(false);
    if (typeof err !== 'string' && err.name === 'NotAllowedError') {
      setError('Camera permission denied. Please allow camera access in your browser to verify your identity.');
    } else if (typeof err !== 'string' && err.name === 'NotFoundError') {
      setError('No camera found on your device. Please connect a camera.');
    } else {
      setError('Unable to access camera. Please check your permissions and hardware.');
    }
  }, []);

  useEffect(() => {
    setStudents(store.getStudents());
  }, []);

  useEffect(() => {
    if (!navigator.geolocation) {
      setLocationError('Geolocation is not supported by your browser.');
      return;
    }

    const watchId = navigator.geolocation.watchPosition(
      (position) => {
        setLocationAccuracy(position.coords.accuracy);
        setLocationError('');
      },
      (err) => {
        let msg = 'Location error';
        switch(err.code) {
          case err.PERMISSION_DENIED:
            msg = 'Location permission denied. Please allow location access in your browser settings.';
            break;
          case err.POSITION_UNAVAILABLE:
            msg = 'Location information is unavailable. Please check your GPS signal.';
            break;
          case err.TIMEOUT:
            msg = 'Location request timed out. Please try again.';
            break;
          default:
            msg = `Location error: ${err.message}`;
        }
        setLocationError(msg);
        setLocationAccuracy(null);
      },
      { enableHighAccuracy: true, timeout: 10000, maximumAge: 0 }
    );

    return () => navigator.geolocation.clearWatch(watchId);
  }, []);

  const handleMarkAttendance = async () => {
    if (!selectedStudent) {
      setError('Please select your name first.');
      return;
    }

    if (!photoData) {
      setError('Please take a photo to verify your identity.');
      setIsCapturing(true);
      return;
    }

    setLoading(true);
    setError('');
    setResult(null);

    const mark = (lat: number, lng: number) => {
      const distance = getDistanceInMeters(lat, lng, COLLEGE_LAT, COLLEGE_LNG);
      const isInside = distance <= ALLOWED_RADIUS_METERS;
      const status = isInside ? 'Present' : 'Absent';
      const today = format(new Date(), 'yyyy-MM-dd');

      const student = students.find(s => s.id === selectedStudent);

      const record = store.markAttendance({
        studentId: selectedStudent,
        date: today,
        timestamp: Date.now(),
        status,
        distanceMeters: distance,
        lat,
        lng,
        photoUrl: photoData,
        reason: !isInside && reason.trim() ? reason.trim() : undefined
      });

      if (!isInside && student) {
        // Log an SMS to parents
        store.logSms({
          studentId: student.id,
          phone: student.parentPhone,
          message: `Dear Parent, your ward ${student.name} was marked ABSENT today (${format(new Date(), 'dd MMM yyyy')}) as they attempted to mark attendance from outside the college premises.${reason.trim() ? ` Reason provided: ${reason.trim()}` : ''}`,
          timestamp: Date.now()
        });
      }

      setResult(record);
      setLoading(false);
      setPhotoData(null); // Reset photo after successful marking
      setReason(''); // Reset reason
    };

    if (simulatedLocation === 'inside') {
      // Simulate exactly at college
      setTimeout(() => mark(COLLEGE_LAT, COLLEGE_LNG), 1000);
    } else if (simulatedLocation === 'outside') {
      // Simulate 2km away
      setTimeout(() => mark(COLLEGE_LAT + 0.02, COLLEGE_LNG + 0.02), 1000);
    } else {
      if (!navigator.geolocation) {
        setError('Geolocation is not supported by your browser.');
        setLoading(false);
        return;
      }

      navigator.geolocation.getCurrentPosition(
        (position) => {
          mark(position.coords.latitude, position.coords.longitude);
        },
        (err) => {
          let msg = 'Location error';
          switch(err.code) {
            case err.PERMISSION_DENIED:
              msg = 'Location permission denied. Please allow location access to mark attendance.';
              break;
            case err.POSITION_UNAVAILABLE:
              msg = 'Location information is unavailable. Please check your GPS signal.';
              break;
            case err.TIMEOUT:
              msg = 'Location request timed out. Please try again.';
              break;
            default:
              msg = `Location error: ${err.message}`;
          }
          setError(msg);
          setLoading(false);
        },
        { enableHighAccuracy: true, timeout: 10000, maximumAge: 0 }
      );
    }
  };

  return (
    <motion.div 
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      className="max-w-md mx-auto px-4 py-12"
    >
      <div className="mb-12 text-center">
        <motion.div 
          initial={{ y: -20 }}
          animate={{ y: 0 }}
          className="w-16 h-16 bg-zinc-900 rounded-3xl flex items-center justify-center mx-auto mb-6 shadow-xl shadow-zinc-900/20"
        >
          <MapPin className="w-8 h-8 text-white" />
        </motion.div>
        <h2 className="text-3xl font-bold tracking-tight text-zinc-900">Student Portal</h2>
        <p className="text-zinc-500 mt-2 text-sm font-medium">Mark your daily attendance</p>
      </div>

      <div className="space-y-8 bg-white p-6 sm:p-8 rounded-[2rem] shadow-sm border border-zinc-100">
        <div>
          <label className="block text-sm font-semibold text-zinc-700 mb-2">Select Student</label>
          <select
            className="w-full p-4 bg-zinc-50 rounded-2xl focus:ring-2 focus:ring-zinc-900 outline-none transition-all text-base border-none text-zinc-900 cursor-pointer font-medium"
            value={selectedStudent}
            onChange={(e) => setSelectedStudent(e.target.value)}
          >
            <option value="">-- Choose your name --</option>
            {students.map(s => (
              <option key={s.id} value={s.id}>{s.name} ({s.department})</option>
            ))}
          </select>
        </div>

        <AnimatePresence>
          {selectedStudent && (
            <motion.div 
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              className="space-y-6 overflow-hidden"
            >
              <div>
                <label className="block text-sm font-semibold text-zinc-700 mb-2">Identity Verification</label>
                {!photoData && !isCapturing && (
                  <button
                    onClick={() => setIsCapturing(true)}
                    className="w-full flex flex-col items-center justify-center gap-3 bg-zinc-50 rounded-3xl p-8 hover:bg-zinc-100 transition-all text-zinc-500 hover:text-zinc-800 border border-dashed border-zinc-200"
                  >
                    <Camera className="w-8 h-8" />
                    <span className="text-sm font-semibold">Tap to take a photo</span>
                  </button>
                )}

                {isCapturing && (
                  <motion.div 
                    initial={{ scale: 0.95, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    className="relative rounded-3xl overflow-hidden bg-zinc-900 aspect-video flex items-center justify-center shadow-inner"
                  >
                    {/* @ts-expect-error react-webcam types are overly strict in this version */}
                    <Webcam
                      audio={false}
                      ref={webcamRef}
                      screenshotFormat="image/jpeg"
                      videoConstraints={{ facingMode: "user" }}
                      onUserMediaError={handleCameraError}
                      className="w-full h-full object-cover"
                    />
                    
                    {/* Scanning overlay */}
                    <motion.div 
                      animate={{ y: ['-100%', '200%'] }}
                      transition={{ repeat: Infinity, duration: 2, ease: "linear" }}
                      className="absolute inset-0 w-full h-1/2 bg-gradient-to-b from-transparent to-emerald-500/20 border-b border-emerald-500/50 pointer-events-none"
                    />

                    <div className="absolute bottom-4 left-0 right-0 flex justify-center">
                      <button
                        onClick={capturePhoto}
                        className="bg-white text-zinc-900 p-4 rounded-full shadow-xl hover:scale-105 transition-transform"
                      >
                        <Camera className="w-6 h-6" />
                      </button>
                    </div>
                    <button
                      onClick={() => setIsCapturing(false)}
                      className="absolute top-4 right-4 bg-black/50 backdrop-blur-md text-white p-2 rounded-full hover:bg-black/70 transition-colors"
                    >
                      <XCircle className="w-5 h-5" />
                    </button>
                  </motion.div>
                )}

                {photoData && (
                  <motion.div 
                    initial={{ scale: 0.95, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    className="relative rounded-3xl overflow-hidden aspect-video shadow-sm border border-zinc-100"
                  >
                    <img src={photoData} alt="Captured identity" className="w-full h-full object-cover" />
                    <div className="absolute bottom-4 right-4">
                      <button
                        onClick={retakePhoto}
                        className="flex items-center gap-2 bg-white/90 backdrop-blur-md text-zinc-900 px-4 py-2 rounded-xl text-sm font-semibold shadow-lg hover:bg-white transition-colors"
                      >
                        <RefreshCw className="w-4 h-4" /> Retake
                      </button>
                    </div>
                  </motion.div>
                )}
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Dev Tools for simulation since we are in a preview environment */}
        <div className="py-6 border-y border-zinc-100">
          <p className="text-xs font-semibold text-zinc-500 mb-4 uppercase tracking-wider">Simulation Mode (Dev Only)</p>
          <div className="flex gap-2">
            <button 
              onClick={() => setSimulatedLocation('real')}
              className={`flex-1 text-xs py-2.5 rounded-xl font-semibold transition-colors ${simulatedLocation === 'real' ? 'bg-zinc-900 text-white shadow-md shadow-zinc-900/20' : 'bg-zinc-50 text-zinc-600 hover:bg-zinc-100'}`}
            >
              Real GPS
            </button>
            <button 
              onClick={() => setSimulatedLocation('inside')}
              className={`flex-1 text-xs py-2.5 rounded-xl font-semibold transition-colors ${simulatedLocation === 'inside' ? 'bg-emerald-600 text-white shadow-md shadow-emerald-600/20' : 'bg-emerald-50 text-emerald-700 hover:bg-emerald-100'}`}
            >
              Inside
            </button>
            <button 
              onClick={() => setSimulatedLocation('outside')}
              className={`flex-1 text-xs py-2.5 rounded-xl font-semibold transition-colors ${simulatedLocation === 'outside' ? 'bg-red-600 text-white shadow-md shadow-red-600/20' : 'bg-red-50 text-red-700 hover:bg-red-100'}`}
            >
              Outside
            </button>
          </div>
        </div>

        {simulatedLocation === 'real' && (
          <div className={`py-4 transition-colors ${
            locationAccuracy === null ? '' :
            locationAccuracy <= 20 ? 'text-emerald-900' :
            locationAccuracy <= 50 ? 'text-blue-900' :
            locationAccuracy <= 100 ? 'text-amber-900' :
            'text-red-900'
          }`}>
            <div className="flex items-center justify-between mb-3">
              <span className="text-sm font-semibold flex items-center gap-2">
                <MapPin className="w-4 h-4 opacity-50" />
                GPS Signal
              </span>
              {locationAccuracy !== null ? (
                <span className={`text-xs font-bold px-3 py-1 rounded-full flex items-center gap-1.5 ${
                  locationAccuracy <= 20 ? 'bg-emerald-100 text-emerald-700' :
                  locationAccuracy <= 50 ? 'bg-blue-100 text-blue-700' :
                  locationAccuracy <= 100 ? 'bg-amber-100 text-amber-700' :
                  'bg-red-100 text-red-700'
                }`}>
                  {locationAccuracy <= 20 ? <SignalHigh className="w-4 h-4" /> : 
                   locationAccuracy <= 50 ? <SignalMedium className="w-4 h-4" /> : 
                   <SignalLow className="w-4 h-4" />}
                  {locationAccuracy <= 20 ? 'Excellent' : 
                   locationAccuracy <= 50 ? 'Good' : 
                   locationAccuracy <= 100 ? 'Poor' : 'Unusable'}
                </span>
              ) : (
                <span className="text-xs font-semibold opacity-70 flex items-center gap-1.5">
                  <Loader2 className="w-3.5 h-3.5 animate-spin" /> Detecting...
                </span>
              )}
            </div>
            {locationAccuracy !== null && (
              <div className="space-y-1.5 mt-4">
                <p className="text-sm font-mono opacity-80 font-medium">
                  Accuracy: ±{Math.round(locationAccuracy)}m
                </p>
                <p className={`text-sm leading-relaxed ${
                  locationAccuracy <= 20 ? 'text-emerald-600' :
                  locationAccuracy <= 50 ? 'text-blue-600' :
                  locationAccuracy <= 100 ? 'text-amber-600' :
                  'text-red-600 font-medium'
                }`}>
                  {locationAccuracy <= 20 ? 'Perfect for precise attendance marking.' :
                   locationAccuracy <= 50 ? 'Good enough for attendance, but might be slightly off.' :
                   locationAccuracy <= 100 ? 'Signal is weak. You might be marked absent if near the boundary. Move outside.' :
                   'Signal is too weak. Attendance marking is disabled. Please move to a clear area.'}
                </p>
              </div>
            )}
            {locationError && (
              <p className="text-sm text-red-600 mt-3 font-semibold bg-red-50 p-3 rounded-xl border border-red-100">{locationError}</p>
            )}
          </div>
        )}

        {selectedStudent && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
            <label className="block text-sm font-semibold text-zinc-700 mb-2">
              Reason for Absence (Optional)
            </label>
            <textarea
              className="w-full p-4 bg-zinc-50 rounded-2xl focus:ring-2 focus:ring-zinc-900 outline-none transition-all resize-none text-base border-none font-medium"
              placeholder="If you are outside the college, please provide a reason..."
              rows={3}
              value={reason}
              onChange={(e) => setReason(e.target.value)}
            />
            <p className="text-xs text-zinc-500 mt-2 font-medium">Only recorded if you are marked absent.</p>
          </motion.div>
        )}

        <button
          onClick={handleMarkAttendance}
          disabled={loading || !selectedStudent || (simulatedLocation === 'real' && locationAccuracy !== null && locationAccuracy > 100)}
          className="w-full flex items-center justify-center gap-2 bg-zinc-900 hover:bg-zinc-800 disabled:bg-zinc-100 disabled:text-zinc-400 disabled:cursor-not-allowed text-white py-4 rounded-2xl font-bold text-base transition-all active:scale-[0.98] shadow-xl shadow-zinc-900/20 disabled:shadow-none"
        >
          {loading ? (
            <><Loader2 className="w-5 h-5 animate-spin" /> Verifying Location...</>
          ) : (
            <><Navigation className="w-5 h-5" /> Mark Attendance</>
          )}
        </button>

        {error && (
          <motion.div 
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="p-4 bg-red-50 text-red-700 rounded-2xl text-sm font-semibold flex items-start gap-3 border border-red-100"
          >
            <XCircle className="w-5 h-5 shrink-0 mt-0.5" />
            <p>{error}</p>
          </motion.div>
        )}

        <AnimatePresence>
          {result && (
            <motion.div 
              initial={{ opacity: 0, scale: 0.9, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              className={`p-6 rounded-3xl border ${
                result.status === 'Present' 
                  ? 'bg-emerald-50 border-emerald-100 text-emerald-900' 
                  : 'bg-red-50 border-red-100 text-red-900'
              }`}
            >
              <div className="flex items-start gap-4">
                {result.status === 'Present' ? (
                  <CheckCircle className="w-8 h-8 text-emerald-500 shrink-0" />
                ) : (
                  <XCircle className="w-8 h-8 text-red-500 shrink-0" />
                )}
                <div>
                  <h3 className="font-bold text-lg mb-1">
                    {result.status === 'Present' ? 'Attendance Marked' : 'Marked Absent'}
                  </h3>
                  <p className="text-sm opacity-80 mb-3 font-medium">
                    {result.status === 'Present' 
                      ? 'You are within the college premises.' 
                      : 'You are outside the allowed radius.'}
                  </p>
                  <div className="flex items-center gap-2 text-xs font-mono bg-white/50 px-3 py-2 rounded-xl inline-flex font-semibold">
                    <MapPin className="w-3.5 h-3.5" />
                    {(result.distanceMeters / 1000).toFixed(2)} km away
                  </div>
                  {result.status === 'Absent' && (
                    <p className="text-xs text-red-700 mt-3 font-semibold bg-red-100/50 px-3 py-2 rounded-xl inline-block border border-red-100">
                      SMS Alert sent to parent automatically.
                    </p>
                  )}
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </motion.div>
  );
}
