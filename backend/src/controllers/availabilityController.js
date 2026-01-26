const Availability = require('../models/Availability');
const asyncHandler = require('../middleware/asyncHandler');

// @desc    Get availability for a date range
// @route   GET /api/availability
// @access  Public
exports.getAvailability = asyncHandler(async (req, res) => {
  const { startDate, endDate } = req.query;
  
  const query = {};
  if (startDate || endDate) {
    query.date = {};
    if (startDate) query.date.$gte = new Date(startDate);
    if (endDate) query.date.$lte = new Date(endDate);
  }
  
  const availability = await Availability.find(query)
    .select('-notes') // Exclude admin notes from public view
    .sort({ date: 1 });
  
  res.json({
    success: true,
    count: availability.length,
    data: availability
  });
});

// @desc    Get availability for specific date
// @route   GET /api/availability/:date
// @access  Public
exports.getAvailabilityByDate = asyncHandler(async (req, res) => {
  const { date } = req.params;
  
  const availability = await Availability.findOne({ date: new Date(date) })
    .select('-notes');
  
  if (!availability) {
    return res.status(404).json({
      success: false,
      message: 'No availability found for this date'
    });
  }
  
  res.json({
    success: true,
    data: availability
  });
});

// @desc    Create or update availability
// @route   POST /api/availability
// @access  Private/Admin
exports.createOrUpdateAvailability = asyncHandler(async (req, res) => {
  const { date, status, slots, notes } = req.body;
  
  const availability = await Availability.findOneAndUpdate(
    { date: new Date(date) },
    {
      date: new Date(date),
      status,
      slots,
      notes,
      updatedAt: Date.now()
    },
    { new: true, upsert: true, runValidators: true }
  );
  
  res.status(200).json({
    success: true,
    data: availability
  });
});

// @desc    Update availability status
// @route   PUT /api/availability/:id
// @access  Private/Admin
exports.updateAvailability = asyncHandler(async (req, res) => {
  const { status, slots, notes } = req.body;
  
  const availability = await Availability.findByIdAndUpdate(
    req.params.id,
    { status, slots, notes, updatedAt: Date.now() },
    { new: true, runValidators: true }
  );
  
  if (!availability) {
    return res.status(404).json({
      success: false,
      message: 'Availability not found'
    });
  }
  
  res.json({
    success: true,
    data: availability
  });
});

// @desc    Delete availability
// @route   DELETE /api/availability/:id
// @access  Private/Admin
exports.deleteAvailability = asyncHandler(async (req, res) => {
  const availability = await Availability.findByIdAndDelete(req.params.id);
  
  if (!availability) {
    return res.status(404).json({
      success: false,
      message: 'Availability not found'
    });
  }
  
  res.json({
    success: true,
    message: 'Availability deleted successfully'
  });
});

// @desc    Get calendar month view (30 days from today)
// @route   GET /api/availability/calendar/month
// @access  Public
exports.getCalendarMonth = asyncHandler(async (req, res) => {
  const { month, year } = req.query;
  const currentDate = new Date();
  
  let startDate, endDate;
  
  if (month && year) {
    startDate = new Date(year, month - 1, 1);
    endDate = new Date(year, month, 0);
  } else {
    startDate = new Date(currentDate.getFullYear(), currentDate.getMonth(), 1);
    endDate = new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 0);
  }
  
  const availability = await Availability.find({
    date: { $gte: startDate, $lte: endDate }
  })
  .select('-notes')
  .sort({ date: 1 });
  
  // Create a map of all days in the month
  const daysInMonth = [];
  const current = new Date(startDate);
  
  while (current <= endDate) {
    const dateStr = current.toISOString().split('T')[0];
    const existingAvailability = availability.find(
      a => a.date.toISOString().split('T')[0] === dateStr
    );
    
    daysInMonth.push({
      date: new Date(current),
      status: existingAvailability ? existingAvailability.status : 'available',
      hasSlots: existingAvailability && existingAvailability.slots && existingAvailability.slots.length > 0,
      availableSlots: existingAvailability ? existingAvailability.slots.filter(s => !s.isBooked).length : 0
    });
    
    current.setDate(current.getDate() + 1);
  }
  
  res.json({
    success: true,
    month: month || currentDate.getMonth() + 1,
    year: year || currentDate.getFullYear(),
    data: daysInMonth
  });
});
