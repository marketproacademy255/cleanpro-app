-- Starter pricing (based on typical US cleaning-service pricing structure:
-- Merry Maids, Molly Maid, MaidPro — adapted to the Uzbekistan market in UZS).
-- Edit any time via the Admin panel > "Xizmatlar va narxlar".

insert into public.service_types (code, name_uz, name_en, description_uz, property_type, pricing_unit, base_price, extra_unit_price, min_price, multiplier, sort_order) values
('standard_home','Standart tozalash','Standard Cleaning','Muntazam uy tozaligini saqlash uchun: chang artish, polni yuvish, sanuzel va oshxonani tozalash.','home','per_room',150000,40000,150000,1.0,1),
('deep_home','Chuqur tozalash','Deep Cleaning','Har bir burchakni qamrab oluvchi mukammal tozalash: plintuslar, batareyalar, yorug''lik asboblari va boshqalar.','home','per_room',210000,56000,210000,1.4,2),
('move_home','Ko''chishdan oldin/keyin tozalash','Move In/Out Cleaning','Bo''sh xonadonni to''liq tozalash: shkaflar ichi, oynalar, chuqur yuvish.','home','per_room',240000,64000,240000,1.6,3),
('office_clean','Ofis tozalash','Office Cleaning','Ish joyingiz uchun professional tozalash xizmati, kv.m bo''yicha hisoblanadi.','office','per_sqm',0,8000,300000,1.0,4)
on conflict (code) do nothing;

insert into public.addons (code, name_uz, price, sort_order) values
('fridge_inside','Muzlatgich ichkarisi',30000,1),
('oven_inside','Duxovka ichkarisi',30000,2),
('cabinets_inside','Shkaflar ichkarisi',40000,3),
('windows_inside','Oynalar (ichki tomondan)',50000,4),
('balcony','Balkon/loggiya',40000,5),
('ironing','Kir dazmollash',35000,6)
on conflict (code) do nothing;

insert into public.cleaners (full_name, phone, bio, years_experience, rating) values
('Madina Yusupova','+998901112233','Uy va ofislarni tozalashda 5 yillik tajribaga ega, ekologik vositalar bilan ishlaydi.',5,4.9),
('Aziz Rahimov','+998901112244','Chuqur tozalash va ko''chish oldidan tozalash bo''yicha mutaxassis.',4,4.8),
('Nilufar Karimova','+998901112255','Ofis va tijorat maydonlarini tozalashda ixtisoslashgan jamoa boshlig''i.',6,5.0),
('Bekzod Tursunov','+998901112266','Tez va sifatli xizmat, mijozlar tomonidan yuqori baholangan.',3,4.7)
on conflict do nothing;
