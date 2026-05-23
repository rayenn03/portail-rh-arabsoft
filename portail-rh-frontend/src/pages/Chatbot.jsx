import Layout from '../components/Layout'
import ChatPanel from '../components/ChatPanel'

export default function Chatbot() {
  // La logique chat est centralisée dans <ChatPanel> (réutilisé aussi par la bulle flottante).
  // storageKey 'chatbot_history' = historique partagé entre la page et la bulle.
  return (
    <Layout title="Assistant RH">
      <ChatPanel mode="full" storageKey="chatbot_history" />
    </Layout>
  )
}
