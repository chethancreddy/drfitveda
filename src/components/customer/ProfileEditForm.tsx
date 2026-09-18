'use client'
// ============================================================
// ProfileEditForm — Customer health and food profile editor
// ============================================================
import { useState } from 'react'
import { useRouter } from 'next/navigation'

interface ProfileProps {
  initialFullName: string
  initialPhone: string
  initialProfile?: {
    date_of_birth?: string | null
    gender?: string | null
    height_cm?: number | null
    weight_kg?: number | null
    occupation?: string | null
    sleep_hours?: number | null
    activity_level?: string | null
    stress_level?: number | null
    lifestyle_notes?: string | null
    goals?: string | null
  }
  initialFood?: {
    dietary_preference?: string | null
    allergies?: string | null
    water_intake_liters?: number | null
  }
}

export default function ProfileEditForm({
  initialFullName,
  initialPhone,
  initialProfile,
  initialFood,
}: ProfileProps) {
  const router = useRouter()
  const [fullName, setFullName] = useState(initialFullName || '')
  const [phone, setPhone] = useState(initialPhone || '')
  const [dob, setDob] = useState(initialProfile?.date_of_birth || '')
  const [gender, setGender] = useState(initialProfile?.gender || 'male')
  const [height, setHeight] = useState(initialProfile?.height_cm ? String(initialProfile.height_cm) : '')
  const [weight, setWeight] = useState(initialProfile?.weight_kg ? String(initialProfile.weight_kg) : '')
  const [occupation, setOccupation] = useState(initialProfile?.occupation || '')
  const [sleepHours, setSleepHours] = useState(initialProfile?.sleep_hours ? String(initialProfile.sleep_hours) : '7')
  const [activityLevel, setActivityLevel] = useState(initialProfile?.activity_level || 'moderate')
  const [stressLevel, setStressLevel] = useState(initialProfile?.stress_level ? String(initialProfile.stress_level) : '5')
  const [goals, setGoals] = useState(initialProfile?.goals || '')
  const [lifestyleNotes, setLifestyleNotes] = useState(initialProfile?.lifestyle_notes || '')
  
  const [dietaryPref, setDietaryPref] = useState(initialFood?.dietary_preference || 'vegetarian')
  const [allergies, setAllergies] = useState(initialFood?.allergies || '')
  const [waterIntake, setWaterIntake] = useState(initialFood?.water_intake_liters ? String(initialFood.water_intake_liters) : '2.5')

  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState(false)

  // Live BMI calculation
  const h = parseFloat(height)
  const w = parseFloat(weight)
  const bmi = (h > 0 && w > 0) ? (w / ((h / 100) ** 2)).toFixed(1) : null

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)
    setLoading(true)

    try {
      const res = await fetch('/api/customers/profile', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          full_name: fullName,
          phone,
          date_of_birth: dob,
          gender,
          height_cm: height,
          weight_kg: weight,
          occupation,
          sleep_hours: sleepHours,
          activity_level: activityLevel,
          stress_level: stressLevel,
          goals,
          lifestyle_notes: lifestyleNotes,
          dietary_preference: dietaryPref,
          allergies,
          water_intake_liters: waterIntake,
        })
      })

      const data = await res.json()
      if (!res.ok) throw new Error(data.error || 'Failed to update profile')

      setSuccess(true)
      setTimeout(() => {
        setSuccess(false)
        router.refresh()
      }, 2000)
    } catch (err: any) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  return (
    <form onSubmit={handleSubmit} className="card" style={{padding:'var(--space-md)'}}>
      {error && <div className="alert alert-error" style={{marginBottom:'var(--space-sm)'}}>{error}</div>}
      {success && <div className="alert alert-success" style={{marginBottom:'var(--space-sm)'}}>Profile saved successfully!</div>}

      <div style={{marginBottom:'var(--space-md)'}}>
        <h3 className="text-label-lg" style={{marginBottom:12}}>Personal Details</h3>
        <div style={{display:'grid',gridTemplateColumns:'repeat(auto-fit, minmax(220px, 1fr))',gap:'var(--space-sm)'}}>
          <div>
            <label className="text-label-md" style={{display:'block',marginBottom:4}}>Full Name</label>
            <input type="text" className="input" value={fullName} onChange={e => setFullName(e.target.value)} required />
          </div>
          <div>
            <label className="text-label-md" style={{display:'block',marginBottom:4}}>Phone Number</label>
            <input type="tel" className="input" value={phone} onChange={e => setPhone(e.target.value)} />
          </div>
          <div>
            <label className="text-label-md" style={{display:'block',marginBottom:4}}>Date of Birth</label>
            <input type="date" className="input" value={dob} onChange={e => setDob(e.target.value)} />
          </div>
          <div>
            <label className="text-label-md" style={{display:'block',marginBottom:4}}>Gender</label>
            <select className="input" value={gender} onChange={e => setGender(e.target.value)}>
              <option value="male">Male</option>
              <option value="female">Female</option>
              <option value="other">Other</option>
              <option value="prefer_not_to_say">Prefer not to say</option>
            </select>
          </div>
        </div>
      </div>

      <div style={{marginBottom:'var(--space-md)'}}>
        <h3 className="text-label-lg" style={{marginBottom:12}}>Body Metrics</h3>
        <div style={{display:'grid',gridTemplateColumns:'repeat(auto-fit, minmax(180px, 1fr))',gap:'var(--space-sm)',alignItems:'center'}}>
          <div>
            <label className="text-label-md" style={{display:'block',marginBottom:4}}>Height (cm)</label>
            <input type="number" step="0.1" className="input" value={height} onChange={e => setHeight(e.target.value)} placeholder="e.g. 175" />
          </div>
          <div>
            <label className="text-label-md" style={{display:'block',marginBottom:4}}>Weight (kg)</label>
            <input type="number" step="0.1" className="input" value={weight} onChange={e => setWeight(e.target.value)} placeholder="e.g. 72.5" />
          </div>
          <div>
            <label className="text-label-md" style={{display:'block',marginBottom:4}}>Calculated BMI</label>
            <div style={{padding:'8px 12px',background:'var(--color-neutral)',borderRadius:'var(--radius-sm)',fontWeight:600,fontSize:18}}>
              {bmi ? `${bmi} kg/m²` : '—'}
            </div>
          </div>
        </div>
      </div>

      <div style={{marginBottom:'var(--space-md)'}}>
        <h3 className="text-label-lg" style={{marginBottom:12}}>Lifestyle & Daily Routine</h3>
        <div style={{display:'grid',gridTemplateColumns:'repeat(auto-fit, minmax(220px, 1fr))',gap:'var(--space-sm)',marginBottom:'var(--space-sm)'}}>
          <div>
            <label className="text-label-md" style={{display:'block',marginBottom:4}}>Occupation</label>
            <input type="text" className="input" value={occupation} onChange={e => setOccupation(e.target.value)} placeholder="e.g. Software Engineer" />
          </div>
          <div>
            <label className="text-label-md" style={{display:'block',marginBottom:4}}>Sleep (hours / night)</label>
            <input type="number" step="0.5" className="input" value={sleepHours} onChange={e => setSleepHours(e.target.value)} />
          </div>
          <div>
            <label className="text-label-md" style={{display:'block',marginBottom:4}}>Activity Level</label>
            <select className="input" value={activityLevel} onChange={e => setActivityLevel(e.target.value)}>
              <option value="sedentary">Sedentary (mostly sitting)</option>
              <option value="light">Lightly Active</option>
              <option value="moderate">Moderately Active</option>
              <option value="very_active">Very Active</option>
            </select>
          </div>
        </div>

        <div style={{marginBottom:'var(--space-sm)'}}>
          <label className="text-label-md" style={{display:'block',marginBottom:4}}>
            Stress Level: <strong>{stressLevel} / 10</strong>
          </label>
          <input
            type="range"
            min="1"
            max="10"
            value={stressLevel}
            onChange={e => setStressLevel(e.target.value)}
            style={{width:'100%'}}
          />
        </div>

        <div>
          <label className="text-label-md" style={{display:'block',marginBottom:4}}>Health Goals</label>
          <textarea
            className="input"
            rows={2}
            value={goals}
            onChange={e => setGoals(e.target.value)}
            placeholder="e.g. Reduce cholesterol, lose 5kg, manage stress, improve digestion"
          />
        </div>
      </div>

      <div style={{marginBottom:'var(--space-md)'}}>
        <h3 className="text-label-lg" style={{marginBottom:12}}>Dietary & Food Habits</h3>
        <div style={{display:'grid',gridTemplateColumns:'repeat(auto-fit, minmax(220px, 1fr))',gap:'var(--space-sm)'}}>
          <div>
            <label className="text-label-md" style={{display:'block',marginBottom:4}}>Dietary Preference</label>
            <select className="input" value={dietaryPref} onChange={e => setDietaryPref(e.target.value)}>
              <option value="vegetarian">Vegetarian</option>
              <option value="vegan">Vegan</option>
              <option value="non_vegetarian">Non-Vegetarian</option>
              <option value="eggetarian">Eggetarian</option>
              <option value="jain">Jain</option>
              <option value="other">Other</option>
            </select>
          </div>
          <div>
            <label className="text-label-md" style={{display:'block',marginBottom:4}}>Water Intake (Liters/day)</label>
            <input type="number" step="0.1" className="input" value={waterIntake} onChange={e => setWaterIntake(e.target.value)} />
          </div>
          <div>
            <label className="text-label-md" style={{display:'block',marginBottom:4}}>Allergies / Restrictions</label>
            <input type="text" className="input" value={allergies} onChange={e => setAllergies(e.target.value)} placeholder="e.g. Gluten, lactose, nuts" />
          </div>
        </div>
      </div>

      <div className="flex justify-end">
        <button type="submit" className="btn btn-primary" disabled={loading}>
          {loading ? 'Saving Changes...' : 'Save Profile'}
        </button>
      </div>
    </form>
  )
}
