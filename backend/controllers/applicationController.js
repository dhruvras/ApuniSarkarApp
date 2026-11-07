import Application from '../models/Application.js';
import User from '../models/User.js';

const SERVICE_NAMES = {
  income: { en: 'Income Certificate', hi: 'आय प्रमाण पत्र' },
  domicile: { en: 'Permanent Resident / Domicile Certificate', hi: 'स्थायी निवास प्रमाण पत्र' },
  caste: { en: 'Caste Certificate', hi: 'जाति प्रमाण पत्र' },
  character: { en: 'Character Certificate', hi: 'चरित्र प्रमाण पत्र' },
};

export const createApplication = async (req, res) => {
  try {
    const { serviceType, applicantName, mobile, district, tehsil, details } = req.body;

    if (!serviceType || !applicantName || !district || !tehsil) {
      return res.status(400).json({ message: 'Missing required application fields' });
    }

    const serviceName = SERVICE_NAMES[serviceType]?.en || serviceType;
    const year = new Date().getFullYear();
    const randomDigits = Math.floor(100000 + Math.random() * 900000);
    const applicationId = `AS-${year}-${randomDigits}`;

    const newApp = new Application({
      applicationId,
      userId: req.user.userId,
      serviceType,
      serviceName,
      applicantName,
      mobile: mobile || req.user.mobile || '',
      district,
      tehsil,
      details: details || {},
      status: 'pending',
      timeline: [
        {
          stage: 'Application Submitted Online',
          status: 'completed',
          updatedAt: new Date(),
          remarks: 'Citizen submitted application successfully.',
        },
        {
          stage: 'Verification by Patwari / Lekhpal',
          status: 'current',
          updatedAt: new Date(),
          remarks: 'Documents forwarded for local field verification.',
        },
        {
          stage: 'Scrutiny by Tehsildar',
          status: 'upcoming',
          remarks: 'Awaiting field report.',
        },
        {
          stage: 'Digital Certificate Approval by Sub-Divisional Magistrate (SDM)',
          status: 'upcoming',
          remarks: 'Final sign-off and issuance.',
        },
      ],
    });

    await newApp.save();

    res.status(201).json({
      message: 'Application submitted successfully!',
      application: newApp,
    });
  } catch (err) {
    console.error('Create application error:', err);
    res.status(500).json({ message: 'Failed to submit application', error: err.message });
  }
};

export const getMyApplications = async (req, res) => {
  try {
    const applications = await Application.find({ userId: req.user.userId })
      .sort({ createdAt: -1 });

    res.json({ applications });
  } catch (err) {
    console.error('Fetch applications error:', err);
    res.status(500).json({ message: 'Failed to fetch applications', error: err.message });
  }
};

export const getApplicationStats = async (req, res) => {
  try {
    const userId = req.user.userId;
    const total = await Application.countDocuments({ userId });
    const pending = await Application.countDocuments({ userId, status: 'pending' });
    const approved = await Application.countDocuments({ userId, status: 'approved' });
    const rejected = await Application.countDocuments({ userId, status: 'rejected' });
    const drafts = await Application.countDocuments({ userId, status: 'draft' });

    res.json({
      stats: {
        total,
        pending,
        approved,
        rejected,
        drafts,
      },
    });
  } catch (err) {
    console.error('Stats error:', err);
    res.status(500).json({ message: 'Failed to fetch stats', error: err.message });
  }
};

export const getApplicationById = async (req, res) => {
  try {
    const { id } = req.params;
    const application = await Application.findOne({
      $or: [{ _id: id }, { applicationId: id }],
      userId: req.user.userId,
    });

    if (!application) {
      return res.status(404).json({ message: 'Application not found' });
    }

    res.json({ application });
  } catch (err) {
    console.error('Fetch single application error:', err);
    res.status(500).json({ message: 'Failed to fetch application details', error: err.message });
  }
};

export const advanceApplicationStage = async (req, res) => {
  try {
    const { id } = req.params;
    const application = await Application.findOne({
      $or: [{ _id: id }, { applicationId: id }],
      userId: req.user.userId,
    });

    if (!application) {
      return res.status(404).json({ message: 'Application not found' });
    }

    if (application.status === 'approved') {
      return res.json({
        message: 'Application is already approved and certificate issued.',
        application,
      });
    }

    const currentIndex = application.timeline.findIndex((t) => t.status === 'current');

    if (currentIndex === -1) {
      const nextUpcoming = application.timeline.findIndex((t) => t.status === 'upcoming');
      if (nextUpcoming !== -1) {
        application.timeline[nextUpcoming].status = 'current';
        application.timeline[nextUpcoming].updatedAt = new Date();
      }
    } else if (currentIndex === application.timeline.length - 1) {
      application.timeline[currentIndex].status = 'completed';
      application.timeline[currentIndex].updatedAt = new Date();
      application.timeline[currentIndex].remarks = 'Approved and digitally signed by Sub-Divisional Magistrate (SDM).';
      application.status = 'approved';
      const year = new Date().getFullYear();
      const rand = Math.floor(100000 + Math.random() * 900000);
      application.certificateNumber = `UK-CERT-${year}-${rand}`;
      application.issuedAt = new Date();
      application.officerRemarks = 'All field verification criteria satisfied. Digitally issued.';
    } else {
      application.timeline[currentIndex].status = 'completed';
      application.timeline[currentIndex].updatedAt = new Date();
      if (currentIndex === 1) {
        application.timeline[currentIndex].remarks = 'Field verification completed and report endorsed by Lekhpal.';
      } else if (currentIndex === 2) {
        application.timeline[currentIndex].remarks = 'Revenue records verified and approved by Tehsildar.';
      }

      const nextIndex = currentIndex + 1;
      application.timeline[nextIndex].status = 'current';
      application.timeline[nextIndex].updatedAt = new Date();
      if (nextIndex === 2) {
        application.timeline[nextIndex].remarks = 'Under official scrutiny by Tehsildar.';
      } else if (nextIndex === 3) {
        application.timeline[nextIndex].remarks = 'Under final digital approval by Sub-Divisional Magistrate (SDM).';
      }
    }

    await application.save();

    res.json({
      message: application.status === 'approved' ? 'Application approved & certificate issued!' : 'Application stage advanced successfully',
      application,
    });
  } catch (err) {
    console.error('Advance application error:', err);
    res.status(500).json({ message: 'Failed to advance application stage', error: err.message });
  }
};

