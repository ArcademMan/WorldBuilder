import {
  Anchor,
  Award,
  Axe,
  Backpack,
  Baby,
  Bird,
  BookOpen,
  Bookmark,
  Brain,
  Bug,
  Building,
  Building2,
  Cat,
  Castle,
  Church,
  Cloud,
  CloudRain,
  Coins,
  Compass,
  Cpu,
  Crosshair,
  Crown,
  Dog,
  Droplet,
  Eye,
  Feather,
  Fish,
  Flag,
  Flame,
  Flower2,
  Gem,
  Ghost,
  Globe,
  Hammer,
  Heart,
  Home,
  Hourglass,
  Key,
  Landmark,
  Leaf,
  type LucideIcon,
  Map as MapIcon,
  MapPin,
  Moon,
  Mountain,
  Music,
  Package,
  Pickaxe,
  Rabbit,
  Rocket,
  Scroll,
  Shield,
  Skull,
  Snowflake,
  Sparkles,
  Squirrel,
  Star,
  Sun,
  Sword,
  Swords,
  Target,
  Tent,
  Trees,
  TreePine,
  Trophy,
  User,
  UserCircle,
  Users,
  Wand2,
  Warehouse,
  Wind,
  Wrench,
  Zap,
} from "lucide-react";

export const ICON_PREFIX = "lucide:";

type Group = {
  name: string;
  icons: { id: string; component: LucideIcon }[];
};

export const ICON_GROUPS: Group[] = [
  {
    name: "People",
    icons: [
      { id: "User", component: User },
      { id: "Users", component: Users },
      { id: "UserCircle", component: UserCircle },
      { id: "Crown", component: Crown },
      { id: "Skull", component: Skull },
      { id: "Ghost", component: Ghost },
      { id: "Baby", component: Baby },
      { id: "Brain", component: Brain },
      { id: "Eye", component: Eye },
      { id: "Heart", component: Heart },
    ],
  },
  {
    name: "Combat",
    icons: [
      { id: "Sword", component: Sword },
      { id: "Swords", component: Swords },
      { id: "Shield", component: Shield },
      { id: "Crosshair", component: Crosshair },
      { id: "Target", component: Target },
      { id: "Axe", component: Axe },
    ],
  },
  {
    name: "Magic & Power",
    icons: [
      { id: "Sparkles", component: Sparkles },
      { id: "Wand2", component: Wand2 },
      { id: "Flame", component: Flame },
      { id: "Zap", component: Zap },
      { id: "Snowflake", component: Snowflake },
      { id: "Droplet", component: Droplet },
    ],
  },
  {
    name: "Items",
    icons: [
      { id: "Gem", component: Gem },
      { id: "Key", component: Key },
      { id: "Scroll", component: Scroll },
      { id: "BookOpen", component: BookOpen },
      { id: "Backpack", component: Backpack },
      { id: "Coins", component: Coins },
      { id: "Package", component: Package },
      { id: "Feather", component: Feather },
      { id: "Hourglass", component: Hourglass },
    ],
  },
  {
    name: "Places",
    icons: [
      { id: "MapPin", component: MapPin },
      { id: "Map", component: MapIcon },
      { id: "Mountain", component: Mountain },
      { id: "Castle", component: Castle },
      { id: "Home", component: Home },
      { id: "Building", component: Building },
      { id: "Building2", component: Building2 },
      { id: "Church", component: Church },
      { id: "Warehouse", component: Warehouse },
      { id: "Landmark", component: Landmark },
      { id: "Tent", component: Tent },
      { id: "Anchor", component: Anchor },
      { id: "Compass", component: Compass },
      { id: "Globe", component: Globe },
    ],
  },
  {
    name: "Nature",
    icons: [
      { id: "Sun", component: Sun },
      { id: "Moon", component: Moon },
      { id: "Star", component: Star },
      { id: "Cloud", component: Cloud },
      { id: "CloudRain", component: CloudRain },
      { id: "Wind", component: Wind },
      { id: "Leaf", component: Leaf },
      { id: "Flower2", component: Flower2 },
      { id: "TreePine", component: TreePine },
      { id: "Trees", component: Trees },
    ],
  },
  {
    name: "Animals",
    icons: [
      { id: "Cat", component: Cat },
      { id: "Dog", component: Dog },
      { id: "Bird", component: Bird },
      { id: "Bug", component: Bug },
      { id: "Fish", component: Fish },
      { id: "Rabbit", component: Rabbit },
      { id: "Squirrel", component: Squirrel },
    ],
  },
  {
    name: "Tools & Tech",
    icons: [
      { id: "Hammer", component: Hammer },
      { id: "Wrench", component: Wrench },
      { id: "Pickaxe", component: Pickaxe },
      { id: "Cpu", component: Cpu },
      { id: "Rocket", component: Rocket },
    ],
  },
  {
    name: "Misc",
    icons: [
      { id: "Bookmark", component: Bookmark },
      { id: "Flag", component: Flag },
      { id: "Trophy", component: Trophy },
      { id: "Award", component: Award },
      { id: "Music", component: Music },
    ],
  },
];

const ICON_INDEX: Map<string, LucideIcon> = new Map(
  ICON_GROUPS.flatMap((g) => g.icons.map((i) => [i.id, i.component])),
);

export function lookupLucideIcon(value: string | undefined | null): LucideIcon | null {
  if (!value || !value.startsWith(ICON_PREFIX)) return null;
  const name = value.slice(ICON_PREFIX.length);
  return ICON_INDEX.get(name) ?? null;
}

export function makeLucideIconValue(name: string): string {
  return `${ICON_PREFIX}${name}`;
}
