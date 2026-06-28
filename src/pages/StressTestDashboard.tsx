import { StressTestRunner } from '@/components/StressTestRunner'
import { GenderBiasTestRunner } from '@/components/GenderBiasTestRunner'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'

export default function StressTestDashboard() {
  return (
    <div className="container mx-auto max-w-5xl py-8 px-4">
      <Tabs defaultValue="battery" className="w-full">
        <TabsList className="grid w-full grid-cols-2 mb-6">
          <TabsTrigger value="battery">Bateria 01 — Estresse Clínico</TabsTrigger>
          <TabsTrigger value="gender">Consistência de Gênero</TabsTrigger>
        </TabsList>
        <TabsContent value="battery">
          <StressTestRunner />
        </TabsContent>
        <TabsContent value="gender">
          <GenderBiasTestRunner />
        </TabsContent>
      </Tabs>
    </div>
  )
}
