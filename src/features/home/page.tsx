import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { List } from "lucide-react";

const ToolboxOptions = [
  {
    optionName: "Monster List",
    optionDescription: "",
    optionIcon: <List />,
    optionButtonName: "Go",
    optionNavigation: "",
  },
  {
    optionName: "Monster Rune List",
    optionDescription: "",
    optionIcon: <List />,
    optionButtonName: "Go",
    optionNavigation: "",
  },
];

const Home = () => {
  return (
    <div>
      <Card className="w-full">
        <CardHeader>
          <CardTitle>Welcome to the Toolbox</CardTitle>
          <CardDescription>
            This toolbox, made to help you find monsters from Amellwind's
            Monster Hunter Homebrew Manual for D&D5e, is a toolbox to help you
            find monsters from Amellwind's Monster Hunter Homebrew Manual for
            D&D5e.
          </CardDescription>
        </CardHeader>
        <CardContent className="flex space-x-4">
          {ToolboxOptions.map((option) => (
            <div>
              <Card className="w-[350px]">
                <CardTitle>
                  <div className="flex justify-center">
                    {option.optionIcon} {option.optionName}
                  </div>
                </CardTitle>
                <CardDescription>{option.optionDescription}</CardDescription>
                <CardFooter>
                  <Button>{option.optionButtonName}</Button>
                </CardFooter>
              </Card>
            </div>
          ))}
        </CardContent>
      </Card>
    </div>
  );
};

export default Home;
