import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { 
  useBusinessUnit, 
  BUSINESS_UNITS, 
  BusinessUnit 
} from "@/contexts/BusinessUnitContext";

export default function BusinessUnitTabs() {
  const { 
    businessUnit, 
    setBusinessUnit 
  } = useBusinessUnit();

  const handleUnitChange = (value: string) => {
    setBusinessUnit(value as BusinessUnit);
  };

  return (
    <div className="flex flex-col gap-4">
      {/* Main Business Unit Tabs */}
      <div className="border-b border-border">
        <Tabs value={businessUnit} onValueChange={handleUnitChange} className="w-full">
          <TabsList className="h-auto p-0 bg-transparent border-0 w-full justify-start gap-0">
            {BUSINESS_UNITS.map((unit, index) => (
              <TabsTrigger
                key={unit.id}
                value={unit.id}
                className="relative px-6 py-3 text-sm font-bold uppercase tracking-wider rounded-none border-b-2 border-transparent data-[state=active]:border-primary data-[state=active]:text-primary data-[state=active]:bg-transparent bg-transparent hover:text-primary/80 transition-colors"
              >
                <div className="flex items-center gap-2">
                  {index === 0 && businessUnit === unit.id && (
                    <div className="w-2 h-2 bg-primary" />
                  )}
                  {unit.name.toUpperCase()}
                </div>
              </TabsTrigger>
            ))}
          </TabsList>
        </Tabs>
      </div>


    </div>
  );
}
