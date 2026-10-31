import { msg91WhatsAppService } from '../src/lib/services/msg91-whatsapp.service'

async function checkLiveTemplates() {
  console.log('Querying MSG91 live templates for integrated number:', msg91WhatsAppService.integratedNumber)
  const templates = await msg91WhatsAppService.getTemplatesStatus()
  console.log(`Found ${templates.length} templates on account:`)
  console.log(JSON.stringify(templates, null, 2))

  const target = templates.find(t => t.name.trim() === 'drfitveda_customer_doctor_assigned')
  if (target) {
    console.log('\n🎯 TARGET TEMPLATE FOUND:')
    console.log(`- Name: ${target.name}`)
    console.log(`- Status: ${target.status}`)
    console.log(`- Meta Template ID: ${target.templateId}`)
    console.log(`- MSG91 Template ID: ${target.msg91TemplateId}`)
    console.log(`- Namespace: ${target.namespace}`)
    console.log(`- Variables: ${JSON.stringify(target.variables)}`)
  } else {
    console.log('\n⚠️ Template "drfitveda_customer_doctor_assigned" was not found in the list yet.')
  }
}

checkLiveTemplates().catch(console.error)

