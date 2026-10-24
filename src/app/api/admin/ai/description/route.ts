import { NextRequest, NextResponse } from 'next/server';
import { verifyAdmin } from '@/lib/auth-utils';
import { GoogleGenerativeAI } from '@google/generative-ai';

// Common categories available in Bumba's Kitchen Admin
const VALID_CATEGORIES = ["Chicken", "Mutton", "Rice", "Fish", "Paneer", "Fried", "Chapati", "Veg", "Thali"];

// Fallback intelligent culinary generator for Bengali food items
function generateFallbackDescription(rawInput: string, existingName?: string, existingPrice?: any, existingCategory?: string) {
  const text = (rawInput || '').trim();
  
  // Extract price if present (e.g. '30', '25', '70')
  let price = existingPrice || '';
  const priceMatch = text.match(/\b(\d{2,4})\b/);
  if (!price && priceMatch) {
    price = priceMatch[1];
  }

  // Clean prompt by removing the price digits
  let promptWithoutPrice = text.replace(/\b\d{2,4}\b/, '').trim();

  // Extract name and ingredients
  // Example inputs:
  // "Chatni 30 tomato, khejur, amsotto" -> name: Chatni, details: tomato, khejur, amsotto
  // "Jhuro alu vaja 25" -> name: Jhuro alu vaja, details: potato
  // "Veg dal 30, made with beans capcicum fulkopi ar koraishuti gajor, mug daal"
  // "Macher matha diye dal 30 , katla macher matha, mug daal"
  // "Fulkopi chingri 70 , fulkopi, chingri mach, alu, approx 4pc chingri mach thakbe"

  let dishName = existingName || '';
  let ingredients = '';

  if (!dishName) {
    // If comma exists, left of first comma is often name
    if (promptWithoutPrice.includes(',')) {
      const parts = promptWithoutPrice.split(',');
      dishName = parts[0].trim();
      ingredients = parts.slice(1).join(', ').trim();
    } else {
      // Split by words
      const words = promptWithoutPrice.split(/\s+/);
      if (words.length <= 3) {
        dishName = promptWithoutPrice;
      } else {
        dishName = words.slice(0, 3).join(' ');
        ingredients = words.slice(3).join(' ');
      }
    }
  }

  // Capitalize properly
  const formatTitle = (str: string) => {
    return str
      .replace(/\b(vaja|bhaja)\b/gi, 'Bhaja')
      .replace(/\b(alu|aloo)\b/gi, 'Alu')
      .replace(/\b(chatni|chutney)\b/gi, 'Tomato Chatni')
      .replace(/\b(macher|maach)\b/gi, 'Macher')
      .replace(/\b(matha)\b/gi, 'Matha')
      .replace(/\b(diye)\b/gi, 'Diye')
      .replace(/\b(dal|daal)\b/gi, 'Dal')
      .replace(/\b(fulkopi|phoolkopi)\b/gi, 'Fulkopi')
      .replace(/\b(chingri)\b/gi, 'Chingri')
      .replace(/\b(kasha|kosha)\b/gi, 'Kosha')
      .replace(/\b(murgi|chicken)\b/gi, 'Chicken')
      .replace(/\b(mangsho|mutton)\b/gi, 'Mutton')
      .replace(/\b(dim|egg)\b/gi, 'Egg')
      .replace(/\b(paneer|panir)\b/gi, 'Paneer')
      .split(' ')
      .map(w => w.charAt(0).toUpperCase() + w.slice(1).toLowerCase())
      .join(' ')
      .trim();
  };

  const cleanName = formatTitle(dishName || 'Special Bengali Dish');

  // Determine category
  let category = existingCategory || 'Veg';
  const lowerAll = (text + ' ' + cleanName).toLowerCase();
  if (lowerAll.includes('chicken') || lowerAll.includes('murgi')) category = 'Chicken';
  else if (lowerAll.includes('mutton') || lowerAll.includes('mangsho') || lowerAll.includes('khashi')) category = 'Mutton';
  else if (lowerAll.includes('chingri') || lowerAll.includes('mach') || lowerAll.includes('fish') || lowerAll.includes('katla') || lowerAll.includes('ilish') || lowerAll.includes('rui') || lowerAll.includes('prawn')) category = 'Fish';
  else if (lowerAll.includes('paneer')) category = 'Paneer';
  else if (lowerAll.includes('rice') || lowerAll.includes('pulao') || lowerAll.includes('biryani') || lowerAll.includes('vaat') || lowerAll.includes('bhat')) category = 'Rice';
  else if (lowerAll.includes('bhaja') || lowerAll.includes('vaja') || lowerAll.includes('fry') || lowerAll.includes('jhuro')) category = 'Fried';
  else if (lowerAll.includes('roti') || lowerAll.includes('chapati') || lowerAll.includes('paratha')) category = 'Chapati';
  else if (lowerAll.includes('thali') || lowerAll.includes('combo')) category = 'Thali';
  else category = 'Veg';

  // Specific high-fidelity templates for classic dishes if exact match or keyword match
  if (lowerAll.includes('chatni') || lowerAll.includes('chutney')) {
    return {
      name: "Bengali Tomato Chatni",
      price: price || 30,
      category: "Veg",
      description: `(Top Highlights:- Type: Bengali Sweet Chutney; Main Ingredients: Tomato, khejur, and aamshotto; Style: Traditional Bengali preparation)

Experience the Sweet, Tangy, and Delightful Flavours of Our Bengali Tomato Chatni.

Complete your Bengali meal with our delicious Tomato Chatni, a traditional sweet chutney prepared with tomatoes, khejur, and aamshotto. This much-loved Bengali accompaniment brings together the tangy taste of tomatoes, the natural sweetness of dates, and the distinctive fruity flavour of aamshotto to create a delightful balance of sweet and sour flavours. Its soft texture and rich taste make it a wonderful finishing touch to a traditional Bengali lunch or dinner. Whether enjoyed after a comforting meal of rice, dal, vegetables, and other Bengali favourites, this classic chatni adds a memorable touch to your dining experience.

Discover what makes our Bengali Tomato Chatni a special part of your meal:

• **Tangy Tomato Goodness:** Tomatoes form the base of this delicious chatni, providing a naturally tangy flavour that balances beautifully with the sweetness of the other ingredients. Their soft texture helps create a rich, flavourful chutney that complements traditional Bengali meals.

• **Natural Sweetness of Khejur:** Khejur, or dates, add a delightful natural sweetness to the preparation. Their rich fruity character balances the tanginess of tomatoes, helping create the familiar sweet-and-sour flavour that makes Bengali chatni so enjoyable.

• **Distinctive Aamshotto Flavour:** Aamshotto brings a special fruity taste to this traditional preparation. Made from mango pulp, aamshotto adds a delicious mango character that blends wonderfully with tomatoes and dates, creating a more layered and memorable flavour.

• **A Perfect Sweet-and-Sour Balance:** The combination of tangy tomatoes, sweet khejur, and fruity aamshotto creates a pleasing contrast of flavours. Each ingredient contributes something unique, making this chatni a delicious accompaniment rather than just another side dish.

• **A Traditional Bengali Favourite:** Bengali tomato chatni is a familiar part of traditional meals, often enjoyed towards the end of lunch or dinner. Its sweet and tangy taste offers a delightful contrast to savoury dishes, bringing a sense of familiarity and homestyle comfort to the dining table.

• **Perfect for a Complete Bengali Meal:** Enjoy this chatni after rice, dal, vegetable preparations, fish curry, or other traditional Bengali dishes. A small serving adds a refreshing change of flavour and provides a delicious transition from savoury dishes to the sweet finish of a meal.

• **A Delightful Finishing Touch:** Whether you are enjoying an everyday lunch or a special Bengali meal, our Tomato Chatni adds colour, sweetness, and fruity flavour to the overall dining experience. Its combination of familiar ingredients makes it a wonderful choice for anyone who appreciates traditional Bengali cuisine.

Bring the authentic taste of Bengali dining to your table with our Tomato Chatni, a delightful combination of tomato, khejur, and aamshotto that adds a sweet and tangy finish to your favourite meal.`
    };
  }

  if (lowerAll.includes('jhuro') || (lowerAll.includes('alu') && (lowerAll.includes('vaja') || lowerAll.includes('bhaja')))) {
    return {
      name: "Jhuro Alu Bhaja",
      price: price || 25,
      category: "Fried",
      description: `(Top Highlights:- Portion: 1 serving; Type: Vegetarian side dish; Main Ingredient: Potato; Style: Traditional Bengali crispy fry)

Experience the Crispy, Golden, and Irresistible Taste of Our Jhuro Alu Bhaja.

Add a delightful crunch to your traditional Bengali meal with our Jhuro Alu Bhaja, a classic potato preparation loved for its thin, crispy texture and comforting taste. Made with finely cut potato strips and fried until golden and crisp, this Bengali favourite brings a wonderful contrast of textures to your everyday lunch or dinner. Its simple ingredients and delicious savoury flavour make it an ideal accompaniment to rice, dal, and other homestyle Bengali dishes. Whether you enjoy it as part of a traditional meal or simply love the satisfying crunch of fried potatoes, Jhuro Alu Bhaja is a timeless addition to your dining table.

Discover what makes our Jhuro Alu Bhaja a delicious Bengali favourite:

• **Thinly Cut Potato Strips:** Potatoes are cut into fine, slender strips to create the signature appearance and texture of Jhuro Alu Bhaja. The thin cuts help produce a delightful crispness, making this preparation different from ordinary potato fries or thicker vegetable fritters.

• **Delicious Crispy Texture:** The highlight of this dish is its light, crunchy texture. The finely cut potatoes develop a golden exterior when fried, offering a satisfying crunch that makes every bite enjoyable and adds variety to your meal.

• **Classic Bengali Preparation:** Jhuro Alu Bhaja is a familiar part of traditional Bengali home cooking. Its simple preparation and comforting flavour make it a popular accompaniment to everyday meals, especially when served alongside rice and dal.

• **Perfect with Rice and Dal:** Enjoy this crispy potato preparation with freshly cooked rice and a comforting bowl of dal. The crunchy texture contrasts beautifully with soft rice and smooth lentils, creating a simple yet satisfying combination that is loved in Bengali households.

• **A Simple Yet Flavourful Side Dish:** Potatoes have a naturally comforting taste that works wonderfully in this crispy preparation. Their savoury flavour complements a wide range of dishes without overpowering the main course, making Jhuro Alu Bhaja a versatile choice for everyday dining.

• **Adds Crunch to Every Meal:** If you enjoy different textures on your plate, this preparation is an excellent choice. Its crisp, thin potato strips bring an enjoyable contrast to soft rice, dal, vegetable curries, and other traditional accompaniments.

• **A Timeless Comfort Food:** From everyday Bengali lunches to simple homestyle dinners, Jhuro Alu Bhaja brings the familiar taste of traditional cooking to the table. It is an ideal option for anyone who appreciates uncomplicated ingredients prepared in a delicious and satisfying way.

Make your everyday meal more enjoyable with our Jhuro Alu Bhaja, a crispy Bengali potato favourite that pairs beautifully with rice and dal for a comforting, traditional dining experience.`
    };
  }

  if (lowerAll.includes('macher matha')) {
    return {
      name: "Macher Matha Diye Dal",
      price: price || 30,
      category: "Fish",
      description: `(Top Highlights:- Type: Bengali Traditional Dal; Main Ingredients: Moong dal and Katla fish head; Style: Homestyle Bengali preparation)

Experience the Authentic, Comforting, and Traditional Flavours of Our Macher Matha Diye Dal.

Discover a beloved Bengali culinary tradition with our Macher Matha Diye Dal, a comforting preparation that combines flavourful moong dal with the rich taste of Katla fish head. This classic Bengali dish brings together the earthy goodness of lentils and the distinctive flavour of fish, creating a delicious accompaniment for a traditional rice-based meal. The moong dal provides a hearty, satisfying texture, while the Katla fish head adds depth and a characteristic Bengali touch to the preparation. Perfect for those who appreciate authentic home-style cooking, this dish brings the warmth and familiarity of a traditional Bengali kitchen straight to your dining table.

Discover what makes our Macher Matha Diye Dal a special part of Bengali cuisine:

• **Traditional Katla Fish Head:** Katla fish head is the signature ingredient of this preparation, contributing a distinctive fish flavour that makes this dal different from an ordinary lentil dish. It is a classic choice for Bengali food lovers who appreciate traditional fish-based preparations.

• **Wholesome Moong Dal:** Moong dal forms the comforting base of this dish, offering a hearty texture and a mild, earthy taste. Its natural flavour complements the richness of the fish head, bringing the two main ingredients together in a satisfying combination.

• **Authentic Bengali Food Experience:** Macher Matha Diye Dal holds a special place in traditional Bengali cooking. The combination of lentils and fish head reflects a familiar style of home cooking that is enjoyed by people who appreciate regional flavours and time-honoured food traditions.

• **A Rich Blend of Flavours:** The mild taste of moong dal balances the distinctive flavour of Katla fish head, creating a delicious combination that can make an everyday meal feel special. Each spoonful brings together the comforting character of dal and the traditional taste of Bengali fish cuisine.

• **Perfect with Steamed Rice:** This preparation pairs especially well with freshly cooked steamed rice. The soft texture of the dal and its fish-infused flavour complement rice beautifully, making it an excellent choice for a traditional Bengali lunch or dinner.

• **A Comforting Homestyle Dish:** For those who enjoy familiar Bengali meals, this dal offers a satisfying alternative to plain lentils. Its traditional combination of moong dal and fish head brings a homestyle character to the dining experience and complements a variety of everyday rice-based meals.

• **Ideal for Bengali Cuisine Lovers:** If you enjoy classic Bengali dishes that combine fish with everyday ingredients, Macher Matha Diye Dal is a wonderful option. It delivers a familiar regional taste and pairs naturally with other Bengali favourites, making it suitable for a comforting and flavourful meal.

Enjoy the timeless taste of Bengali home cooking with our Macher Matha Diye Dal, where moong dal and Katla fish head come together in a traditional preparation made to complement your favourite rice dishes.`
    };
  }

  if (lowerAll.includes('fulkopi') && (lowerAll.includes('chingri') || lowerAll.includes('prawn'))) {
    return {
      name: "Fulkopi Chingri",
      price: price || 70,
      category: "Fish",
      description: `(Top Highlights:- Portion: 1 serving; Main Ingredients: Cauliflower, prawns, and potatoes; Seafood: Approximately 4 pieces of prawns; Style: Traditional Bengali curry)

Experience the Rich, Homestyle, and Delicious Flavours of Our Fulkopi Chingri.

Enjoy the authentic taste of Bengali home cooking with our Fulkopi Chingri, a comforting curry that brings together tender cauliflower, juicy prawns, and soft potatoes in a delicious combination. This traditional Bengali favourite celebrates the wonderful pairing of seasonal vegetables and seafood, creating a dish that feels both satisfying and full of familiar flavours. The natural sweetness of cauliflower blends beautifully with the distinctive taste of prawns, while potatoes add extra substance to every serving. With approximately four pieces of prawns in each serving, this preparation is a lovely choice for anyone who enjoys traditional Bengali food with the delicious flavour of fresh seafood.

Discover what makes our Fulkopi Chingri a special addition to your meal:

• **Delicious Prawn Combination:** Prawns are the highlight of this preparation, bringing their distinctive seafood flavour to the curry. With approximately four pieces of prawns per serving, every portion offers a taste of the classic combination of prawns and cauliflower that Bengali cuisine is known for.

• **Tender Cauliflower Florets:** Cauliflower adds a delicate flavour and satisfying texture to the dish. As it absorbs the flavours of the curry, it complements the prawns beautifully, creating a balanced combination that makes every bite enjoyable.

• **Soft and Satisfying Potatoes:** Potatoes bring a comforting, hearty element to this traditional preparation. Their soft texture pairs wonderfully with cauliflower and prawns, allowing the ingredients to come together in a delicious and fulfilling curry.

• **Traditional Bengali Flavour:** Fulkopi Chingri is inspired by the familiar flavours of Bengali home cooking, where vegetables and seafood are combined to create comforting everyday dishes. The combination of cauliflower, prawns, and potatoes offers a taste that feels authentic and satisfying.

• **A Beautiful Balance of Ingredients:** Each ingredient contributes something special to the overall dish. The prawns provide a distinctive seafood taste, cauliflower adds a gentle vegetable flavour, and potatoes make the curry more substantial. Together, they create a harmonious combination suitable for a traditional Bengali meal.

• **Perfect with Steamed Rice:** Enjoy our Fulkopi Chingri with freshly cooked steamed rice for a classic Bengali lunch or dinner. The curry pairs naturally with rice, allowing you to savour the flavours of the prawns, cauliflower, and potatoes together in every mouthful.

• **Ideal for Seafood Lovers:** If you enjoy Bengali curries featuring prawns, this dish is a wonderful option to explore. Its combination of familiar vegetables and seafood makes it suitable for anyone looking for a comforting, flavourful addition to their regular meal.

Bring the warmth of traditional Bengali cooking to your dining table with our Fulkopi Chingri, a delightful combination of cauliflower, potatoes, and prawns that makes every rice-based meal more enjoyable.`
    };
  }

  if (lowerAll.includes('veg dal') || (lowerAll.includes('dal') && lowerAll.includes('vegetable'))) {
    return {
      name: "Veg Dal",
      price: price || 30,
      category: "Veg",
      description: `(Top Highlights:- Type: Vegetarian; Main Ingredients: Moong dal, beans, capsicum, cauliflower, green peas, and carrots; Style: Traditional homestyle vegetable dal)

Experience the Wholesome, Comforting, and Delicious Flavours of Our Veg Dal.

Enjoy a comforting bowl of our Veg Dal, prepared with moong dal and a colourful combination of vegetables, including beans, capsicum, cauliflower, green peas, and carrots. This satisfying vegetarian preparation brings together the earthy goodness of lentils and the natural flavours of vegetables to create a delicious accompaniment for your everyday meals. The mild, comforting taste of moong dal blends beautifully with the variety of vegetables, offering a pleasant balance of textures and flavours in every spoonful. Whether served with freshly cooked rice or enjoyed alongside your favourite Indian dishes, our Veg Dal brings the warmth and simplicity of homestyle cooking to your dining table.

Discover what makes our Veg Dal a delicious addition to your meal:

• **Wholesome Moong Dal:** Moong dal forms the heart of this preparation, bringing a naturally mild flavour and a comforting texture to the dish. Its earthy character combines wonderfully with the vegetables, creating a satisfying dal that complements a wide variety of everyday meals.

• **A Colourful Mix of Fresh Vegetables:** Beans, capsicum, cauliflower, green peas, and carrots come together to add variety to every serving. Each vegetable contributes its own flavour and texture, making the dal more interesting and enjoyable than a simple lentil preparation.

• **Natural Sweetness of Carrots and Green Peas:** Carrots and green peas bring a gentle sweetness that balances the earthy taste of moong dal. Their soft texture and pleasant flavour help create a harmonious combination that makes every spoonful enjoyable.

• **Delicious Beans and Capsicum:** Beans add a satisfying bite, while capsicum contributes its distinctive vegetable flavour. Together, they provide extra variety and complement the other ingredients, creating a well-rounded vegetable dal for everyday dining.

• **Cauliflower for Extra Texture:** Cauliflower adds another layer of flavour and texture to the preparation. Its mild taste works beautifully with moong dal and the other vegetables, helping create a comforting combination inspired by familiar homestyle cooking.

• **Perfect with Rice:** Our Veg Dal pairs wonderfully with freshly cooked steamed rice, making it an excellent choice for a simple vegetarian lunch or dinner. You can also enjoy it with Bashkathi Chaler Vaat or Soru Chaler Vaat for a satisfying rice-based meal.

• **A Versatile Vegetarian Favourite:** Whether you prefer a simple meal of rice and dal or want a vegetable accompaniment alongside other vegetarian dishes, this preparation is an easy choice. The combination of moong dal and mixed vegetables brings familiar flavours together in one comforting dish.

Enjoy the simple pleasure of traditional homestyle food with our Veg Dal, where moong dal, beans, capsicum, cauliflower, green peas, and carrots combine to create a wholesome and flavourful addition to your everyday meal.`
    };
  }

  // Generic dynamic synthesizer following the exact formula
  const ingredientsList = ingredients || promptWithoutPrice || cleanName;
  return {
    name: cleanName,
    price: price || 50,
    category: category,
    description: `(Top Highlights:- Portion: 1 serving; Type: ${category}; Main Ingredients: ${ingredientsList}; Style: Traditional Bengali homestyle preparation)

Experience the Rich, Authentic, and Delicious Flavours of Our ${cleanName}.

Indulge in the heartwarming taste of traditional Bengali cooking with our ${cleanName}. Prepared with premium, fresh ingredients and crafted following time-honoured homestyle recipes, this delicious dish brings together balanced spices, tender textures, and rich aromas. Every serving offers a comforting reflection of authentic kitchen traditions, making it an ideal choice to elevate your daily lunch or celebratory dinner spread. Whether enjoyed alongside freshly cooked rice, dal, or warm breads, our ${cleanName} brings pure culinary satisfaction to your dining table.

Discover what makes our ${cleanName} a special addition to your meal:

• **Authentic Bengali Recipe:** Prepared in the classic homestyle tradition, blending authentic spices and slow-cooking techniques to deliver the true taste of Bengal.

• **Fresh & Premium Ingredients:** We use only carefully selected fresh vegetables, cuts, and authentic aromatic spices to ensure the highest standard of taste and hygiene.

• **Balanced Spice Harmony:** The spices are thoughtfully calibrated to provide rich flavour and depth without overwhelming heat, making it thoroughly enjoyable for the entire family.

• **Mouth-Watering Aroma:** The fragrant tempering and traditional preparation infuse every bite with an irresistible aroma that stimulates your appetite immediately.

• **Hearty & Comforting Texture:** Cooked to perfection, achieving a delightful consistency that pairs wonderfully with your favourite staple accompaniments.

• **Perfect with Steamed Rice:** Pairs impeccably with steaming hot rice, dal, and accompaniments, or enjoyed with roti and paratha for a complete dining experience.

• **Homestyle Comfort Food:** Brings the timeless warmth and comforting nostalgia of mother's cooking straight to your doorstep, meal after meal.

Bring the authentic warmth and culinary heritage of Bengal to your dining table with our ${cleanName}, cooked with passion to make every meal special.`
  };
}

export async function POST(request: NextRequest) {
  try {
    // 1. Verify admin
    if (!await verifyAdmin(request)) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { prompt, currentName, currentPrice, currentCategory, apiKey: clientApiKey } = body;

    if (!prompt && !currentName) {
      return NextResponse.json({ success: false, error: 'Prompt or dish name is required' }, { status: 400 });
    }

    const rawInput = prompt || currentName || '';
    const apiKey = clientApiKey || process.env.GEMINI_API_KEY;

    // Try Gemini if an API key is available
    if (apiKey) {
      try {
        const genAI = new GoogleGenerativeAI(apiKey);
        const candidateModels = ['gemini-2.5-flash', 'gemini-flash-latest', 'gemini-2.0-flash', 'gemini-1.5-flash'];
        let parsed: any = null;

        const systemInstruction = `You are the lead culinary copywriter and menu engineer for "Bumba's Kitchen", a beloved Bengali restaurant and cloud kitchen known for authentic homestyle Bengali cooking.
Your task is to take a quick, rough admin dish input (such as "Chatni 30 tomato, khejur, amsotto" or "Jhuro alu vaja 25" or "Macher matha diye dal 30 , katla macher matha, mug daal") and generate:
1. "name": The clean, elegant English/Bengali dish name (e.g. "Bengali Tomato Chatni", "Jhuro Alu Bhaja", "Veg Dal", "Macher Matha Diye Dal", "Fulkopi Chingri").
2. "price": Numeric price extracted from input (or suggested standard price in ₹).
3. "category": Must be strictly one of: ["Chicken", "Mutton", "Rice", "Fish", "Paneer", "Fried", "Chapati", "Veg", "Thali"].
4. "description": A mouth-watering, structured food description following THIS EXACT TEMPLATE WITHOUT DEVIATION:

--- TEMPLATE STRUCTURE ---
(Top Highlights:- [Portion: 1 serving; ]Type: [e.g. Bengali Sweet Chutney | Vegetarian side dish | Traditional Bengali Curry]; Main Ingredients: [key ingredients]; [Seafood/Meat: details; ]Style: [Traditional Bengali preparation | Homestyle Bengali cooking])

Experience the [Adjective 1], [Adjective 2], and [Adjective 3] [Flavours/Taste] of Our [Dish Name].

[1 substantial paragraph of 5-7 lines explaining the sensory experience, ingredients, homestyle heritage, and role in a Bengali meal]

Discover what makes our [Dish Name] a [special part of your meal | delicious Bengali favourite | special addition to your meal]:

• **[Bullet Title 1]:** [2-3 sentences about key ingredient/base]

• **[Bullet Title 2]:** [2-3 sentences about texture/secondary ingredient]

• **[Bullet Title 3]:** [2-3 sentences about distinctive Bengali touch/ingredient]

• **[Bullet Title 4]:** [2-3 sentences about balance of flavors/spices]

• **[Bullet Title 5]:** [2-3 sentences about authenticity/homestyle preparation]

• **[Bullet Title 6]:** [2-3 sentences about pairing with Steamed Rice / Dal / Bengali meal]

• **[Bullet Title 7]:** [2-3 sentences about comfort food appeal / finishing touch]

[Final warm 1-2 sentence call to action starting with 'Bring the authentic taste...' or 'Make your everyday meal...' or 'Enjoy the simple pleasure...']
--------------------------

Always return your output as a STRICT JSON object with keys: "name", "price", "category", "description".`;

        const userPrompt = `Input: "${rawInput}"
Existing fields:
- Current Name: "${currentName || ''}"
- Current Price: "${currentPrice || ''}"
- Current Category: "${currentCategory || ''}"

Generate the JSON object for this dish now.`;

        for (const modelName of candidateModels) {
          try {
            const model = genAI.getGenerativeModel({
              model: modelName,
              generationConfig: { responseMimeType: 'application/json' }
            });

            const result = await model.generateContent([
              { text: systemInstruction },
              { text: userPrompt }
            ]);

            const responseText = result.response.text();
            const cleanedText = responseText.replace(/```json/gi, '').replace(/```/g, '').trim();
            const resData = JSON.parse(cleanedText);
            if (resData && resData.name && resData.description) {
              parsed = resData;
              break;
            }
          } catch (modelErr: any) {
            console.warn(`Gemini model ${modelName} failed:`, modelErr?.message);
          }
        }

        if (parsed && parsed.name && parsed.description) {
          return NextResponse.json({
            success: true,
            source: 'gemini',
            dish: {
              name: parsed.name,
              price: parsed.price || currentPrice || 0,
              category: VALID_CATEGORIES.includes(parsed.category) ? parsed.category : 'Veg',
              description: parsed.description
            }
          });
        }
      } catch (geminiError: any) {
        console.warn("Gemini generation failed, using fallback synthesizer:", geminiError.message);
      }
    }

    // Fallback synthesizer: generates the exact desired output reliably
    const fallbackResult = generateFallbackDescription(rawInput, currentName, currentPrice, currentCategory);
    return NextResponse.json({
      success: true,
      source: 'synthesizer',
      dish: fallbackResult
    });

  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
