'use server'
import { revalidatePath } from 'next/cache'
import dbConnect from '@/db/connection'
import Property from '@/db/models/Property'
import mongoose from 'mongoose'

export async function getAllProperties() {
  try {
    await dbConnect()
    const properties = await Property.find().sort({ createdAt: -1 }).lean()
    return properties.map((prop: any) => ({
      _id: prop._id.toString(),
      name: prop.name || '',
      slug: prop.slug || '',
      description: prop.description || '',
      baseCapacity: prop.baseCapacity || 4,
      maxCapacityWithExtra: prop.maxCapacityWithExtra || 6,
      images: prop.images || [],
      isActive: prop.isActive !== false,
      createdAt: prop.createdAt,
      updatedAt: prop.updatedAt,
    }))
  } catch (error) {
    console.error('Błąd pobierania domków:', error)
    return []
  }
}

export async function getPropertyById(id: string) {
  try {
    await dbConnect()
    const property = await Property.findById(id).lean()
    if (!property) return null
    return {
      _id: property._id.toString(),
      name: property.name || '',
      slug: property.slug || '',
      description: property.description || '',
      baseCapacity: property.baseCapacity || 4,
      maxCapacityWithExtra: property.maxCapacityWithExtra || 6,
      images: property.images || [],
      isActive: property.isActive !== false,
      createdAt: property.createdAt,
      updatedAt: property.updatedAt,
    }
  } catch (error) {
    console.error('Błąd pobierania domku:', error)
    return null
  }
}

export async function createProperty(formData: FormData) {
  try {
    await dbConnect()
    const name = formData.get('name') as string
    const slug = formData.get('slug') as string
    const description = formData.get('description') as string
    const baseCapacity = parseInt(formData.get('baseCapacity') as string, 10)
    const maxCapacityWithExtra = parseInt(formData.get('maxCapacityWithExtra') as string, 10)
    const imagesRaw = formData.get('images') as string
    const images = imagesRaw ? imagesRaw.split(',').map((s: string) => s.trim()).filter(Boolean) : []

    if (!name) throw new Error('Nazwa domku jest wymagana')

    const newProperty = await Property.create({
      name,
      slug: slug || undefined,
      description: description || undefined,
      baseCapacity: baseCapacity || 4,
      maxCapacityWithExtra: maxCapacityWithExtra || 6,
      images,
      isActive: true,
    })

    revalidatePath('/admin/properties')
    return { success: true, message: 'Dodano nowy domek', propertyId: newProperty._id.toString() }
  } catch (error: any) {
    console.error('Błąd tworzenia domku:', error)
    return { success: false, message: error.message || 'Wystąpił błąd' }
  }
}

export async function updateProperty(id: string, formData: FormData) {
  try {
    await dbConnect()
    const name = formData.get('name') as string
    const slug = formData.get('slug') as string
    const description = formData.get('description') as string
    const baseCapacity = parseInt(formData.get('baseCapacity') as string, 10)
    const maxCapacityWithExtra = parseInt(formData.get('maxCapacityWithExtra') as string, 10)
    const imagesRaw = formData.get('images') as string
    const images = imagesRaw ? imagesRaw.split(',').map((s: string) => s.trim()).filter(Boolean) : []
    const isActive = formData.get('isActive') === 'true'

    if (!name) throw new Error('Nazwa domku jest wymagana')

    await Property.findByIdAndUpdate(id, {
      name,
      slug: slug || undefined,
      description: description || undefined,
      baseCapacity: baseCapacity || 4,
      maxCapacityWithExtra: maxCapacityWithExtra || 6,
      images,
      isActive,
    })

    revalidatePath('/admin/properties')
    revalidatePath(`/admin/properties/${id}`)
    return { success: true, message: 'Zapisano zmiany' }
  } catch (error: any) {
    console.error('Błąd aktualizacji domku:', error)
    return { success: false, message: error.message || 'Wystąpił błąd' }
  }
}

export async function togglePropertyActive(id: string, isActive: boolean) {
  try {
    await dbConnect()
    await Property.findByIdAndUpdate(id, { isActive })
    revalidatePath('/admin/properties')
    return { success: true, message: isActive ? 'Aktywowano domek' : 'Dezaktywowano domek' }
  } catch (error: any) {
    console.error('Błąd zmiany statusu:', error)
    return { success: false, message: error.message || 'Wystąpił błąd' }
  }
}

export async function deleteProperty(id: string) {
  try {
    await dbConnect()
    const hasBookings = await mongoose.model('Booking').exists({ propertyId: new mongoose.Types.ObjectId(id) })
    if (hasBookings) {
      return { success: false, message: 'Nie można usunąć domku z istniejącymi rezerwacjami' }
    }
    await Property.findByIdAndDelete(id)
    revalidatePath('/admin/properties')
    return { success: true, message: 'Usunięto domek' }
  } catch (error: any) {
    console.error('Błąd usuwania domku:', error)
    return { success: false, message: error.message || 'Wystąpił błąd' }
  }
}