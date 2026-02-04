# Sliders

Sliders stellen je in staat om te werken met verstelbare numerieke waarden binnen je flows.  
Ze gedragen zich als virtuele draaiknoppen: gebruikers kunnen de slider in de UI slepen, en flows kunnen de waarde op elk moment uitlezen of bijwerken.

Een slider bevat altijd een enkel getal tussen **0 en 100**.  
Dit vaste bereik houdt sliders voorspelbaar en gemakkelijk te gebruiken voor percentages, intensiteiten, of elke genormaliseerde waarde.

## Hoe het werkt

Sliders kunnen zowel vanuit de gebruikersinterface als vanuit flow cards worden bediend.  
Wanneer de waarde verandert, wordt een flow card geactiveerd zodat je op die update kunt reageren.

## Belangrijkste kenmerken

- Door gebruiker gestuurde numerieke invoer.
- Door flow gestuurde updates.
- Optionele real-time updates tijdens het slepen.
- Consistent 0–100 bereik voor alle sliders.
- Geschikt voor fijnafgestelde controle.

## Flow kaarten

_TODO_

## Voorbeelden

### **Helderheidsregeling**

Laat een gebruiker een helderheidsniveau kiezen met een slider; flows passen dat percentage toe op één of meer apparaten.

### **Thermostaat offset of schaling**

Hoewel een thermostaat daadwerkelijke temperaturen kan gebruiken, kan een slider offsets, intensiteiten, of automatiseringsweging regelen.

### **Algemene percentages**

Gebruik sliders voor ventilatorsnelheid, overgangsschaling, mediavolume, of elke op percentage gebaseerde instelling.

## Opmerkingen

- Sliders gebruiken altijd een 0–100 bereik.
- Sliders bewaren de waarde; flows blijven staatloos.
- Je kunt een willekeurig aantal sliders maken, elk geïdentificeerd door naam.
- Stapgrootte bepaalt hoe nauwkeurig de gebruikersinvoer kan zijn. Bijvoorbeeld, een stapgrootte van 5 betekent dat de slider zal springen naar waarden zoals 0, 5, 10, 15, enz. De standaard stapgrootte is 1.
